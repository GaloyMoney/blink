import { usdFromBtcMidPriceFn } from "@app/shared"

import { checkedToSats } from "@domain/bitcoin"
import { InvoiceNotFoundError } from "@domain/bitcoin/lightning"
import {
  CouldNotFindError,
  CouldNotFindWalletInvoiceError,
  InvalidNonHodlInvoiceError,
} from "@domain/errors"
import { WalletInvoiceReceiver } from "@domain/wallet-invoices/wallet-invoice-receiver"
import { paymentAmountFromNumber, WalletCurrency } from "@domain/shared"

import { LockService } from "@services/lock"
import { NewDealerPriceService } from "@services/dealer-price"
import { LndService } from "@services/lnd"
import {
  AccountsRepository,
  UsersRepository,
  WalletInvoicesRepository,
  WalletsRepository,
} from "@services/mongoose"
import { NotificationsService } from "@services/notifications"
import * as LedgerFacade from "@services/ledger/facade"
import {
  addAttributesToCurrentSpan,
  recordExceptionInCurrentSpan,
  wrapAsyncToRunInSpan,
} from "@services/tracing"

import { elapsedSinceTimestamp, runInParallel } from "@utils"

export const handleHeldInvoices = async (logger: Logger): Promise<void> => {
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

      walletInvoice.recipientWalletDescriptor.currency === WalletCurrency.Btc
        ? await updatePendingInvoice({ walletInvoice, logger })
        : await declineHeldInvoice({
            pubkey: walletInvoice.pubkey,
            paymentHash: walletInvoice.paymentHash,
            logger,
          })
    },
  })

  logger.info("finish updating pending invoices")
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

const dealer = NewDealerPriceService()

const updatePendingInvoiceBeforeFinally = async ({
  walletInvoice,
  logger,
}: {
  walletInvoice: WalletInvoice
  logger: Logger
}): Promise<boolean | ApplicationError> => {
  addAttributesToCurrentSpan({
    paymentHash: walletInvoice.paymentHash,
    pubkey: walletInvoice.pubkey,
  })

  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  const walletInvoicesRepo = WalletInvoicesRepository()

  const { pubkey, paymentHash, secret, recipientWalletDescriptor } = walletInvoice

  const pendingInvoiceLogger = logger.child({
    hash: paymentHash,
    walletId: recipientWalletDescriptor.id,
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
    roundedDownReceived: uncheckedRoundedDownReceived,
  } = lnInvoiceLookup

  // TODO: validate roundedDownReceived as user input
  const roundedDownReceived = checkedToSats(uncheckedRoundedDownReceived)
  if (roundedDownReceived instanceof Error) {
    recordExceptionInCurrentSpan({
      error: roundedDownReceived,
      level: roundedDownReceived.level,
    })
    return declineHeldInvoice({
      pubkey: walletInvoice.pubkey,
      paymentHash: walletInvoice.paymentHash,
      logger,
    })
  }

  if (walletInvoice.paid) {
    pendingInvoiceLogger.info("invoice has already been processed")
    return true
  }

  if (!lnInvoiceLookup.isHeld && !lnInvoiceLookup.isSettled) {
    pendingInvoiceLogger.info("invoice has not been paid yet")
    return false
  }

  const receivedBtc = paymentAmountFromNumber({
    amount: roundedDownReceived,
    currency: WalletCurrency.Btc,
  })
  if (receivedBtc instanceof Error) return receivedBtc

  const lockService = LockService()
  return lockService.lockPaymentHash(paymentHash, async () => {
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

    // Prepare metadata and record transaction
    const walletInvoiceReceiver = await WalletInvoiceReceiver({
      walletInvoice,
      receivedBtc,
      usdFromBtc: dealer.getCentsFromSatsForImmediateBuy,
      usdFromBtcMidPrice: usdFromBtcMidPriceFn,
    })
    if (walletInvoiceReceiver instanceof Error) return walletInvoiceReceiver

    if (!lnInvoiceLookup.isSettled) {
      const invoiceSettled = await lndService.settleInvoice({ pubkey, secret })
      if (invoiceSettled instanceof Error) return invoiceSettled
    }

    const invoicePaid = await walletInvoicesRepo.markAsPaid(paymentHash)
    if (invoicePaid instanceof Error) return invoicePaid

    // TODO: this should be a in a mongodb transaction session with the ledger transaction below
    // markAsPaid could be done after the transaction, but we should in that case not only look
    // for walletInvoicesRepo, but also in the ledger to make sure in case the process crash in this
    // loop that an eventual consistency doesn't lead to a double credit

    const metadata = LedgerFacade.LnReceiveLedgerMetadata({
      paymentHash,
      fee: walletInvoiceReceiver.btcBankFee,
      feeDisplayCurrency: Number(
        walletInvoiceReceiver.usdBankFee.amount,
      ) as DisplayCurrencyBaseAmount,
      amountDisplayCurrency: Number(
        walletInvoiceReceiver.usdToCreditReceiver.amount,
      ) as DisplayCurrencyBaseAmount,
      pubkey: walletInvoiceReceiver.pubkey,
    })

    const recipientWallet = await WalletsRepository().findById(
      recipientWalletDescriptor.id,
    )
    if (recipientWallet instanceof Error) return recipientWallet

    const recipientAccount = await AccountsRepository().findById(
      recipientWallet.accountId,
    )
    if (recipientAccount instanceof Error) return recipientAccount

    //TODO: add displayCurrency: displayPaymentAmount.currency,
    const result = await LedgerFacade.recordReceive({
      description,
      recipientWalletDescriptor: {
        ...walletInvoiceReceiver.recipientWalletDescriptor,
        accountId: recipientAccount.id,
      },
      amountToCreditReceiver: {
        usd: walletInvoiceReceiver.usdToCreditReceiver,
        btc: walletInvoiceReceiver.btcToCreditReceiver,
      },
      bankFee: {
        usd: walletInvoiceReceiver.usdBankFee,
        btc: walletInvoiceReceiver.btcBankFee,
      },
      metadata,
      txMetadata: {
        hash: metadata.hash,
      },
    })

    if (result instanceof Error) return result

    // Prepare and send notification
    const { usdToCreditReceiver: displayAmount } = walletInvoiceReceiver
    const displayPaymentAmount: DisplayPaymentAmount<DisplayCurrency> = {
      amount: Number((Number(displayAmount.amount) / 100).toFixed(2)),
      currency: displayAmount.currency,
    } as DisplayPaymentAmount<DisplayCurrency>

    const recipientUser = await UsersRepository().findById(recipientAccount.ownerId)
    if (recipientUser instanceof Error) return recipientUser

    const notificationsService = NotificationsService()
    notificationsService.lightningTxReceived({
      recipientAccountId: recipientWallet.accountId,
      recipientWalletId: recipientWallet.id,
      paymentAmount: walletInvoiceReceiver.receivedAmount(),
      displayPaymentAmount,
      paymentHash,
      recipientDeviceTokens: recipientUser.deviceTokens,
      recipientLanguage: recipientUser.language,
    })

    return true
  })
}

const updatePendingInvoice = wrapAsyncToRunInSpan({
  namespace: "app.invoices",
  fnName: "updatePendingInvoice",
  fn: async ({
    walletInvoice,
    logger,
  }: {
    walletInvoice: WalletInvoice
    logger: Logger
  }): Promise<boolean | ApplicationError> => {
    const result = await updatePendingInvoiceBeforeFinally({
      walletInvoice,
      logger,
    })
    if (result) {
      if (!walletInvoice.paid) {
        const walletInvoices = WalletInvoicesRepository()
        const invoicePaid = await walletInvoices.markAsPaid(walletInvoice.paymentHash)
        if (
          invoicePaid instanceof Error &&
          !(invoicePaid instanceof CouldNotFindWalletInvoiceError)
        ) {
          return invoicePaid
        }
      }
    }
    return result
  },
})

export const declineHeldInvoice = wrapAsyncToRunInSpan({
  namespace: "app.invoices",
  fnName: "declineHeldInvoice",
  fn: async ({
    pubkey,
    paymentHash,
    logger,
  }: {
    pubkey: Pubkey
    paymentHash: PaymentHash
    logger: Logger
  }): Promise<boolean | ApplicationError> => {
    addAttributesToCurrentSpan({ paymentHash, pubkey })

    const lndService = LndService()
    if (lndService instanceof Error) return lndService

    const walletInvoicesRepo = WalletInvoicesRepository()

    const lnInvoiceLookup = await lndService.lookupInvoice({ pubkey, paymentHash })

    const pendingInvoiceLogger = logger.child({
      hash: paymentHash,
      pubkey,
      lnInvoiceLookup,
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

    if (lnInvoiceLookup.isSettled) {
      return new InvalidNonHodlInvoiceError(
        JSON.stringify({ paymentHash: lnInvoiceLookup.paymentHash }),
      )
    }

    if (!lnInvoiceLookup.isHeld) {
      pendingInvoiceLogger.info({ lnInvoiceLookup }, "invoice has not been paid yet")
      return false
    }

    let heldForMsg = ""
    if (lnInvoiceLookup.heldAt) {
      heldForMsg = `for ${elapsedSinceTimestamp(lnInvoiceLookup.heldAt)}s `
    }
    pendingInvoiceLogger.error(
      { lnInvoiceLookup },
      `invoice has been held ${heldForMsg}and is now been cancelled`,
    )

    const invoiceSettled = await lndService.cancelInvoice({ pubkey, paymentHash })
    if (invoiceSettled instanceof Error) return invoiceSettled

    const isDeleted = await walletInvoicesRepo.deleteByPaymentHash(paymentHash)
    if (isDeleted instanceof Error) {
      pendingInvoiceLogger.error("impossible to delete WalletInvoice entry")
    }

    return true
  },
})
