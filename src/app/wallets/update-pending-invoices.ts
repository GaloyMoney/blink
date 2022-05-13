import { getCurrentPrice } from "@app/prices"
import { InvoiceNotFoundError } from "@domain/bitcoin/lightning"
import { DealerPriceServiceError } from "@domain/dealer-price"
import { CouldNotFindError } from "@domain/errors"
import { DisplayCurrencyConverter } from "@domain/fiat/display-currency"
import { DepositFeeCalculator } from "@domain/wallets"
import { WalletCurrency } from "@domain/shared"
import { LockService } from "@services/lock"
import { DealerPriceService } from "@services/dealer-price"
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
}: {
  walletId: WalletId
  logger: Logger
}) => {
  const invoicesRepo = WalletInvoicesRepository()

  const invoices = invoicesRepo.findPendingByWalletId(walletId)
  if (invoices instanceof Error) return invoices

  for await (const walletInvoice of invoices) {
    await updatePendingInvoice({ walletInvoice, logger })
  }
}

export const updatePendingInvoiceByPaymentHash = async ({
  paymentHash,
  logger,
}: {
  paymentHash: PaymentHash
  logger: Logger
}): Promise<boolean | ApplicationError> => {
  const invoicesRepo = WalletInvoicesRepository()
  const walletInvoice = await invoicesRepo.findByPaymentHash(paymentHash)
  if (walletInvoice instanceof CouldNotFindError) {
    logger.info({ paymentHash }, "WalletInvoice doesn't exist")
    return false
  }
  if (walletInvoice instanceof Error) return walletInvoice
  return updatePendingInvoice({ walletInvoice, logger })
}

const updatePendingInvoice = async ({
  walletInvoice,
  logger,
}: {
  walletInvoice: WalletInvoice
  logger: Logger
}): Promise<boolean | ApplicationError> => {
  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  const walletInvoicesRepo = WalletInvoicesRepository()

  const { pubkey, paymentHash, walletId, currency: walletCurrency } = walletInvoice
  let { cents } = walletInvoice

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

  const {
    lnInvoice: { description },
    roundedDownReceived,
  } = lnInvoiceLookup

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

  if (walletCurrency === WalletCurrency.Usd && !cents) {
    const dealerPrice = DealerPriceService()
    const cents_ = await dealerPrice.getCentsFromSatsForImmediateBuy(roundedDownReceived)
    if (cents_ instanceof DealerPriceServiceError) return cents_
    cents = cents_
  }

  const lockService = LockService()
  return lockService.lockPaymentHash({ paymentHash }, async () => {
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
    // markAsPaid could be done after the transaction, but we should in that case not only look
    // for walletInvoicesRepo, but also in the ledger to make sure in case the process crash in this
    // loop that an eventual consistency doesn't lead to a double credit

    const invoicePaid = await walletInvoicesRepo.markAsPaid(paymentHash)
    if (invoicePaid instanceof Error) return invoicePaid

    const feeInboundLiquidity = DepositFeeCalculator().lnDepositFee()

    const dCConverter = DisplayCurrencyConverter(displayCurrencyPerSat)
    const amountDisplayCurrency = dCConverter.fromSats(roundedDownReceived)
    const feeInboundLiquidityDisplayCurrency = dCConverter.fromSats(feeInboundLiquidity)

    const ledgerService = LedgerService()
    const result = await ledgerService.addLnTxReceive({
      walletId,
      walletCurrency,
      paymentHash,
      description,
      sats: roundedDownReceived,
      cents,
      amountDisplayCurrency,
      feeInboundLiquidity,
      feeInboundLiquidityDisplayCurrency,
    })
    if (result instanceof Error) return result

    const notificationsService = NotificationsService(logger)

    if (walletCurrency === WalletCurrency.Btc) {
      notificationsService.lnInvoiceBitcoinWalletPaid({
        paymentHash,
        recipientWalletId: walletId,
        sats: roundedDownReceived,
        displayCurrencyPerSat,
      })
    } else {
      notificationsService.lnInvoiceUsdWalletPaid({
        paymentHash,
        recipientWalletId: walletId,
        cents: cents!,
        displayCurrencyPerSat,
      })
    }

    return true
  })
}
