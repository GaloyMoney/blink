import { getCurrentPrice } from "@app/prices"
import { InvoiceNotFoundError } from "@domain/bitcoin/lightning"
import { CouldNotFindError } from "@domain/errors"
import { DisplayCurrencyConverter } from "@domain/fiat/display-currency"
import { AmountConverter, DepositFeeCalculator, WalletCurrency } from "@domain/wallets"
import { LockService } from "@services"
import { Dealer } from "@services/dealer"
import { LedgerService } from "@services/ledger"
import { LndService } from "@services/lnd"
import { WalletInvoicesRepository } from "@services/mongoose"
import { NotificationsService } from "@services/notifications"
import { runInParallel } from "@utils"

export const updatePendingInvoices = async (logger: Logger): Promise<void> => {
  const invoicesRepo = WalletInvoicesRepository()

  const walletIdsWithPendingInvoices = invoicesRepo.listWalletIdsWithPendingInvoices()

  if (walletIdsWithPendingInvoices instanceof Error) {
    logger.error(
      { error: walletIdsWithPendingInvoices },
      "finish updating pending invoices with error",
    )
    return
  }

  await runInParallel({
    iterator: walletIdsWithPendingInvoices,
    logger,
    processor: async (walletId: WalletId, index: number) => {
      logger.trace(
        "updating pending invoices for wallet %s in worker %d",
        walletId,
        index,
      )
      await updatePendingInvoicesByWalletId({ walletId, logger })
    },
  })

  logger.info("finish updating pending invoices")
}

export const updatePendingInvoicesByWalletId = async ({
  walletId,
  logger,
  lock,
}: {
  walletId: WalletId
  logger: Logger
  lock?: DistributedLock
}) => {
  const invoicesRepo = WalletInvoicesRepository()

  const invoices = invoicesRepo.findPendingByWalletId(walletId)
  if (invoices instanceof Error) return invoices

  for await (const walletInvoice of invoices) {
    await updatePendingInvoice({ walletInvoice, logger, lock })
  }
}

export const updatePendingInvoiceByPaymentHash = async ({
  paymentHash,
  logger,
  lock,
}: {
  paymentHash: PaymentHash
  logger: Logger
  lock?: DistributedLock
}): Promise<boolean | ApplicationError> => {
  const invoicesRepo = WalletInvoicesRepository()
  const walletInvoice = await invoicesRepo.findByPaymentHash(paymentHash)
  if (walletInvoice instanceof CouldNotFindError) {
    logger.info({ paymentHash }, "WalletInvoice doesn't exist")
    return false
  }
  if (walletInvoice instanceof Error) return walletInvoice
  return updatePendingInvoice({ walletInvoice, logger, lock })
}

const updatePendingInvoice = async ({
  walletInvoice,
  logger,
  lock,
}: {
  walletInvoice: WalletInvoice
  logger: Logger
  lock?: DistributedLock
}): Promise<boolean | ApplicationError> => {
  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  const walletInvoicesRepo = WalletInvoicesRepository()

  const { pubkey, paymentHash, walletId, currency: walletCurrency, cents } = walletInvoice
  const lnInvoiceLookup = await lndService.lookupInvoice({ pubkey, paymentHash })
  if (lnInvoiceLookup instanceof InvoiceNotFoundError) {
    const isDeleted = await walletInvoicesRepo.deleteByPaymentHash(paymentHash)
    if (isDeleted instanceof Error) {
      logger.error(
        { walletInvoice, error: isDeleted },
        "impossible to delete WalletInvoice entry",
      )
      return isDeleted
    }
    return false
  }
  if (lnInvoiceLookup instanceof Error) return lnInvoiceLookup

  if (!lnInvoiceLookup.isSettled) {
    logger.debug({ invoice: lnInvoiceLookup }, "invoice has not been paid")
    return false
  }

  const pendingInvoiceLogger = logger.child({
    hash: paymentHash,
    walletId,
    topic: "payment",
    protocol: "lightning",
    transactionType: "receipt",
    onUs: false,
  })

  if (walletInvoice.paid) {
    pendingInvoiceLogger.info("invoice has already been processed")
    return true
  }

  const lockService = LockService()
  return lockService.lockPaymentHash({ paymentHash, logger, lock }, async () => {
    // we're getting the invoice another time, now behind the lock, to avoid potential race condition
    const invoiceToUpdate = await walletInvoicesRepo.findByPaymentHash(paymentHash)
    if (invoiceToUpdate instanceof CouldNotFindError) {
      pendingInvoiceLogger.error({ paymentHash }, "WalletInvoice doesn't exist")
      return false
    }
    if (invoiceToUpdate instanceof Error) return invoiceToUpdate
    if (invoiceToUpdate.paid) {
      pendingInvoiceLogger.info("invoice has already been processed")
      return true
    }

    const displayCurrencyPerSat = await getCurrentPrice()
    if (displayCurrencyPerSat instanceof Error) return displayCurrencyPerSat

    // TODO: this should be a in a mongodb transaction session with the ledger transaction below
    const invoicePaid = await walletInvoicesRepo.markAsPaid(paymentHash)
    if (invoicePaid instanceof Error) return invoicePaid

    const {
      lnInvoice: { description },
      roundedDownReceived,
    } = lnInvoiceLookup
    const feeInboundLiquidity = DepositFeeCalculator().lnDepositFee()

    const dCConverter = DisplayCurrencyConverter(displayCurrencyPerSat)
    const amountDisplayCurrency = dCConverter.fromSats(roundedDownReceived)
    const feeInboundLiquidityDisplayCurrency = dCConverter.fromSats(feeInboundLiquidity)

    let centsImmediate: UsdCents | undefined
    // case of an amountless invoice with Usd Wallet
    if (walletCurrency === WalletCurrency.Usd && !cents) {
      const converter = AmountConverter({
        dCConverter,
        dealerFns: Dealer(),
      })
      const walletCurrency = WalletCurrency.Usd
      const amounts = await converter.getAmountsReceive({
        walletCurrency,
        sats: roundedDownReceived,
        order: "immediate",
      })
      if (amounts instanceof Error) return amounts
      ;({ cents: centsImmediate } = amounts) // FIXME: not type safe. we should always get cents
    }

    const ledgerService = LedgerService()
    const result = await ledgerService.addLnTxReceive({
      walletId,
      walletCurrency,
      paymentHash,
      description,
      sats: roundedDownReceived,
      cents: cents || centsImmediate,
      amountDisplayCurrency,
      feeInboundLiquidity,
      feeInboundLiquidityDisplayCurrency,
    })
    if (result instanceof Error) return result

    const notificationsService = NotificationsService(logger)
    notificationsService.lnInvoicePaid({
      paymentHash,
      recipientWalletId: walletId,
      amount: roundedDownReceived,
      displayCurrencyPerSat,
    })

    return true
  })
}
