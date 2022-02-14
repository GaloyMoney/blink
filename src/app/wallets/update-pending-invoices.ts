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

export const declineHeldInvoices = async (logger: Logger): Promise<void> => {
  const invoicesRepo = WalletInvoicesRepository()

  const pendingInvoices = invoicesRepo.yieldPending()

  if (pendingInvoices instanceof Error) {
    logger.error(
      { error: pendingInvoices },
      "finish updating pending invoices with error",
    )
    return
  }

  await runInParallel({
    iterator: pendingInvoices,
    logger,
    processor: async (walletInvoice: WalletInvoice, index: number) => {
      logger.trace("updating pending invoices %s in worker %d", index)
      await declineHeldInvoice({ walletInvoice, logger })
    },
  })

  logger.info("finish updating pending invoices")
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

  const {
    pubkey,
    paymentHash,
    walletId,
    currency: walletCurrency,
    secret,
  } = walletInvoice
  let { cents } = walletInvoice

  const pendingInvoiceLogger = logger.child({
    hash: paymentHash,
    walletId,
    topic: "payment",
    protocol: "lightning",
    transactionType: "receipt",
    onUs: false,
  })

  const lnInvoiceLookup = await lndService.lookupInvoice({ pubkey, paymentHash })

  if (lnInvoiceLookup instanceof InvoiceNotFoundError) {
    const isDeleted = await walletInvoicesRepo.deleteByPaymentHash(paymentHash)
    if (isDeleted instanceof Error) {
      pendingInvoiceLogger.error("impossible to delete WalletInvoice entry")
      return isDeleted
    }
    return false
  }

  if (lnInvoiceLookup instanceof Error) return lnInvoiceLookup

  const {
    lnInvoice: { description },
    roundedDownReceived,
  } = lnInvoiceLookup

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

  if (!lnInvoiceLookup.isHeld) {
    pendingInvoiceLogger.info("invoice is not been held")
    return false
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

    if (walletInvoice.paid) {
      pendingInvoiceLogger.info("invoice has already been processed")
      return true
    }

    const displayCurrencyPerSat = await getCurrentPrice()
    if (displayCurrencyPerSat instanceof Error) return displayCurrencyPerSat

    const invoiceSettled = await lndService.settleInvoice({ pubkey, secret })
    if (invoiceSettled instanceof Error) return invoiceSettled

    const invoicePaid = await walletInvoicesRepo.markAsPaid(paymentHash)
    if (invoicePaid instanceof Error) return invoicePaid

    // TODO: this should be a in a mongodb transaction session with the ledger transaction below
    // markAsPaid could be done after the transaction, but we should in that case not only look
    // for walletInvoicesRepo, but also in the ledger to make sure in case the process crash in this
    // loop that an eventual consistency doesn't lead to a double credit

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

const declineHeldInvoice = async ({
  walletInvoice,
  logger,
}: {
  walletInvoice: WalletInvoice
  logger: Logger
}): Promise<boolean | ApplicationError> => {
  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  const walletInvoicesRepo = WalletInvoicesRepository()

  const { pubkey, paymentHash } = walletInvoice

  const lnInvoiceLookup = await lndService.lookupInvoice({ pubkey, paymentHash })

  const pendingInvoiceLogger = logger.child({
    hash: paymentHash,
    lnInvoiceLookup,
    walletInvoice,
    topic: "payment",
    protocol: "lightning",
    transactionType: "receipt",
    onUs: false,
  })

  if (lnInvoiceLookup instanceof InvoiceNotFoundError) {
    const isDeleted = await walletInvoicesRepo.deleteByPaymentHash(paymentHash)
    if (isDeleted instanceof Error) {
      pendingInvoiceLogger.error("impossible to delete WalletInvoice entry")
      return isDeleted
    }
    return false
  }
  if (lnInvoiceLookup instanceof Error) return lnInvoiceLookup

  if (!lnInvoiceLookup.isHeld) {
    pendingInvoiceLogger.info({ lnInvoiceLookup }, "invoice is not been held")
    return false
  }

  pendingInvoiceLogger.error(
    { lnInvoiceLookup },
    "invoice has been held and is now been cancelled",
  )

  const invoiceSettled = await lndService.cancelInvoice({ pubkey, paymentHash })
  if (invoiceSettled instanceof Error) return invoiceSettled

  const isDeleted = await walletInvoicesRepo.deleteByPaymentHash(paymentHash)
  if (isDeleted instanceof Error) {
    pendingInvoiceLogger.error("impossible to delete WalletInvoice entry")
  }

  return true
}
