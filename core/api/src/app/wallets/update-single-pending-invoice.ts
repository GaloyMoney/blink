import { getTransactionForWalletByJournalId } from "./get-transaction-by-journal-id"

import { processPendingInvoiceForDecline } from "./decline-single-pending-invoice"

import {
  ProcessPendingInvoiceResult,
  ProcessPendingInvoiceResultType,
  ProcessedReason,
} from "./process-pending-invoice-result"

import { getCurrentPriceAsDisplayPriceRatio, usdFromBtcMidPriceFn } from "@/app/prices"

import { CouldNotFindError, CouldNotFindWalletInvoiceError } from "@/domain/errors"
import { checkedToSats } from "@/domain/bitcoin"
import { DisplayAmountsConverter } from "@/domain/fiat"
import { InvoiceNotFoundError } from "@/domain/bitcoin/lightning"
import { ErrorLevel, paymentAmountFromNumber, WalletCurrency } from "@/domain/shared"
import { WalletInvoiceReceiver } from "@/domain/wallet-invoices/wallet-invoice-receiver"

import {
  addAttributesToCurrentSpan,
  recordExceptionInCurrentSpan,
  wrapAsyncToRunInSpan,
} from "@/services/tracing"
import {
  AccountsRepository,
  WalletInvoicesRepository,
  WalletsRepository,
  UsersRepository,
} from "@/services/mongoose"
import { LndService } from "@/services/lnd"
import { LockService } from "@/services/lock"
import * as LedgerFacade from "@/services/ledger/facade"
import { DealerPriceService } from "@/services/dealer-price"
import { NotificationsService } from "@/services/notifications"

import { toDisplayBaseAmount } from "@/domain/payments"
import { LockServiceError } from "@/domain/lock"

const assertUnreachable = (x: never): never => {
  throw new Error(`This should never compile with ${x}`)
}

export const updatePendingInvoice = wrapAsyncToRunInSpan({
  namespace: "app.invoices",
  fnName: "updatePendingInvoice",
  fn: async ({
    walletInvoice: walletInvoiceBeforeProcessing,
    logger,
  }: {
    walletInvoice: WalletInvoiceWithOptionalLnInvoice
    logger: Logger
  }): Promise<true | ApplicationError> => {
    const { paymentHash, recipientWalletDescriptor } = walletInvoiceBeforeProcessing

    const pendingInvoiceLogger = logger.child({
      hash: paymentHash,
      walletId: recipientWalletDescriptor.id,
      topic: "payment",
      protocol: "lightning",
      transactionType: "receipt",
      onUs: false,
    })

    const result = await processPendingInvoice({
      walletInvoice: walletInvoiceBeforeProcessing,
      logger: pendingInvoiceLogger,
    })

    const walletInvoices = WalletInvoicesRepository()
    let marked: WalletInvoiceWithOptionalLnInvoice | RepositoryError
    if (walletInvoiceBeforeProcessing.processingCompleted) return true
    switch (result.type) {
      case ProcessPendingInvoiceResultType.MarkProcessedAsCanceledOrExpired:
        marked = await walletInvoices.markAsProcessingCompleted(paymentHash)
        if (marked instanceof Error) {
          pendingInvoiceLogger.error("Unable to mark invoice as processingCompleted")
          return marked
        }
        return true

      case ProcessPendingInvoiceResultType.MarkProcessedAsPaid:
      case ProcessPendingInvoiceResultType.MarkProcessedAsPaidWithError:
        marked = await walletInvoices.markAsPaid(paymentHash)
        if (
          marked instanceof Error &&
          !(marked instanceof CouldNotFindWalletInvoiceError)
        ) {
          return marked
        }
        return "error" in result ? result.error : true

      case ProcessPendingInvoiceResultType.Error:
        return result.error

      case ProcessPendingInvoiceResultType.ReasonInvoiceNotPaidYet:
        return true

      default:
        return assertUnreachable(result)
    }
  },
})

const processPendingInvoice = async ({
  walletInvoice,
  logger: pendingInvoiceLogger,
}: {
  walletInvoice: WalletInvoiceWithOptionalLnInvoice
  logger: Logger
}): Promise<ProcessPendingInvoiceResult> => {
  const {
    pubkey,
    paymentHash,
    recipientWalletDescriptor: recipientInvoiceWalletDescriptor,
  } = walletInvoice
  addAttributesToCurrentSpan({
    paymentHash,
    pubkey,
    "invoices.originalRecipient": JSON.stringify(recipientInvoiceWalletDescriptor),
  })

  // Fetch invoice from lnd service
  const lndService = LndService()
  if (lndService instanceof Error) {
    pendingInvoiceLogger.error("Unable to initialize LndService")
    return ProcessPendingInvoiceResult.err(lndService)
  }

  const lnInvoiceLookup = await lndService.lookupInvoice({ pubkey, paymentHash })
  if (lnInvoiceLookup instanceof InvoiceNotFoundError) {
    return ProcessPendingInvoiceResult.processAsCanceledOrExpired(
      ProcessedReason.InvoiceNotFound,
    )
  }
  if (lnInvoiceLookup instanceof Error) {
    return ProcessPendingInvoiceResult.err(lnInvoiceLookup)
  }

  // Check processed on wallet invoice after lnd invoice has been successfully fetched
  if (walletInvoice.processingCompleted) {
    pendingInvoiceLogger.info("invoice has already been processed")
    return walletInvoice.paid
      ? ProcessPendingInvoiceResult.processAsPaid()
      : ProcessPendingInvoiceResult.processAsCanceledOrExpired(
          ProcessedReason.InvoiceNotFoundOrCanceled,
        )
  }

  // Check status of invoice fetched from lnd service
  const { isCanceled, isHeld, isSettled } = lnInvoiceLookup
  if (isCanceled) {
    pendingInvoiceLogger.info("invoice has been canceled")
    return ProcessPendingInvoiceResult.processAsCanceledOrExpired(
      ProcessedReason.InvoiceCanceled,
    )
  }
  if (!isHeld && !isSettled) {
    pendingInvoiceLogger.info("invoice has not been paid yet")
    return ProcessPendingInvoiceResult.notPaid()
  }

  // Check amount from invoice fetched from lnd service
  const {
    lnInvoice: { description },
    roundedDownReceived: uncheckedRoundedDownReceived,
  } = lnInvoiceLookup
  const roundedDownReceived = checkedToSats(uncheckedRoundedDownReceived)
  if (roundedDownReceived instanceof Error) {
    recordExceptionInCurrentSpan({
      error: roundedDownReceived,
    })
    return processPendingInvoiceForDecline({
      walletInvoice,
      logger: pendingInvoiceLogger,
    })
  }
  const receivedBtc = paymentAmountFromNumber({
    amount: roundedDownReceived,
    currency: WalletCurrency.Btc,
  })
  if (receivedBtc instanceof Error) {
    recordExceptionInCurrentSpan({
      error: receivedBtc,
    })
    return processPendingInvoiceForDecline({
      walletInvoice,
      logger: pendingInvoiceLogger,
    })
  }

  // Continue in lock
  const result = await LockService().lockPaymentHash(paymentHash, async () =>
    lockedUpdatePendingInvoiceSteps({
      recipientWalletId: recipientInvoiceWalletDescriptor.id,
      paymentHash,
      receivedBtc,
      description,
      isSettledInLnd: lnInvoiceLookup.isSettled,
      logger: pendingInvoiceLogger,
    }),
  )
  if (result instanceof LockServiceError) {
    return ProcessPendingInvoiceResult.err(result)
  }
  return result
}

const lockedUpdatePendingInvoiceSteps = async ({
  paymentHash,
  recipientWalletId,
  receivedBtc,
  description,
  logger,

  // Passed in to lock for idempotent "settle" conditional operation
  isSettledInLnd,
}: {
  paymentHash: PaymentHash
  recipientWalletId: WalletId
  receivedBtc: BtcPaymentAmount
  description: string
  logger: Logger

  isSettledInLnd: boolean
}): Promise<ProcessPendingInvoiceResult> => {
  // Refetch wallet invoice
  const walletInvoices = WalletInvoicesRepository()
  const walletInvoiceInsideLock = await walletInvoices.findByPaymentHash(paymentHash)
  if (walletInvoiceInsideLock instanceof CouldNotFindError) {
    logger.error({ paymentHash }, "WalletInvoice doesn't exist")
    return ProcessPendingInvoiceResult.err(walletInvoiceInsideLock)
  }
  if (walletInvoiceInsideLock instanceof Error) {
    return ProcessPendingInvoiceResult.err(walletInvoiceInsideLock)
  }
  if (walletInvoiceInsideLock.processingCompleted) {
    logger.info("invoice has already been processed")
    return walletInvoiceInsideLock.paid
      ? ProcessPendingInvoiceResult.processAsPaid()
      : ProcessPendingInvoiceResult.processAsCanceledOrExpired(
          ProcessedReason.InvoiceNotFoundOrCanceled,
        )
  }

  // Prepare ledger transaction metadata
  const recipientInvoiceWallet = await WalletsRepository().findById(recipientWalletId)
  if (recipientInvoiceWallet instanceof Error) {
    return ProcessPendingInvoiceResult.err(recipientInvoiceWallet)
  }
  const { accountId: recipientAccountId } = recipientInvoiceWallet

  const accountWallets =
    await WalletsRepository().findAccountWalletsByAccountId(recipientAccountId)
  if (accountWallets instanceof Error) {
    return ProcessPendingInvoiceResult.err(accountWallets)
  }

  const receivedWalletInvoice = await WalletInvoiceReceiver({
    walletInvoice: walletInvoiceInsideLock,
    receivedBtc,
    recipientWalletDescriptors: accountWallets,
  }).withConversion({
    mid: { usdFromBtc: usdFromBtcMidPriceFn },
    hedgeBuyUsd: { usdFromBtc: DealerPriceService().getCentsFromSatsForImmediateBuy },
  })
  if (receivedWalletInvoice instanceof Error) {
    return ProcessPendingInvoiceResult.err(receivedWalletInvoice)
  }

  const {
    recipientWalletDescriptor,
    btcToCreditReceiver,
    btcBankFee,
    usdToCreditReceiver,
    usdBankFee,
  } = receivedWalletInvoice

  addAttributesToCurrentSpan({
    "invoices.finalRecipient": JSON.stringify(recipientWalletDescriptor),
  })

  const recipientAccount = await AccountsRepository().findById(recipientAccountId)
  if (recipientAccount instanceof Error) {
    return ProcessPendingInvoiceResult.err(recipientAccount)
  }
  const { displayCurrency: recipientDisplayCurrency } = recipientAccount
  const displayPriceRatio = await getCurrentPriceAsDisplayPriceRatio({
    currency: recipientDisplayCurrency,
  })
  if (displayPriceRatio instanceof Error) {
    return ProcessPendingInvoiceResult.err(displayPriceRatio)
  }
  const { displayAmount: displayPaymentAmount, displayFee } = DisplayAmountsConverter(
    displayPriceRatio,
  ).convert({
    btcPaymentAmount: btcToCreditReceiver,
    btcProtocolAndBankFee: btcBankFee,
    usdPaymentAmount: usdToCreditReceiver,
    usdProtocolAndBankFee: usdBankFee,
  })

  // TODO: this should be a in a mongodb transaction session with the ledger transaction below
  // markAsPaid could be done after the transaction, but we should in that case not only look
  // for walletInvoicesRepo, but also in the ledger to make sure in case the process crash in this
  // loop that an eventual consistency doesn't lead to a double credit
  const {
    metadata,
    creditAccountAdditionalMetadata,
    internalAccountsAdditionalMetadata,
  } = LedgerFacade.LnReceiveLedgerMetadata({
    paymentHash,
    pubkey: walletInvoiceInsideLock.pubkey,
    paymentAmounts: {
      btcPaymentAmount: btcToCreditReceiver,
      usdPaymentAmount: usdToCreditReceiver,
      btcProtocolAndBankFee: btcBankFee,
      usdProtocolAndBankFee: usdBankFee,
    },

    feeDisplayCurrency: toDisplayBaseAmount(displayFee),
    amountDisplayCurrency: toDisplayBaseAmount(displayPaymentAmount),
    displayCurrency: recipientDisplayCurrency,
  })

  // Idempotent settle invoice in lnd
  if (!isSettledInLnd) {
    const lndService = LndService()
    if (lndService instanceof Error) {
      logger.error("Unable to initialize LndService")
      return ProcessPendingInvoiceResult.err(lndService)
    }
    // Returns 'true' on re-runs if invoice is already settled in lnd
    const invoiceSettled = await lndService.settleInvoice({
      pubkey: walletInvoiceInsideLock.pubkey,
      secret: walletInvoiceInsideLock.secret,
    })
    if (invoiceSettled instanceof Error) {
      logger.error({ paymentHash }, "Unable to settleInvoice")
      return ProcessPendingInvoiceResult.err(invoiceSettled)
    }
  }

  // Mark paid and record ledger transaction
  const invoicePaid = await walletInvoices.markAsPaid(paymentHash)
  if (invoicePaid instanceof Error) {
    return ProcessPendingInvoiceResult.err(invoicePaid)
  }

  const journal = await LedgerFacade.recordReceiveOffChain({
    description,
    recipientWalletDescriptor,
    amountToCreditReceiver: {
      usd: usdToCreditReceiver,
      btc: btcToCreditReceiver,
    },
    bankFee: {
      usd: usdBankFee,
      btc: btcBankFee,
    },
    metadata,
    txMetadata: {
      hash: metadata.hash,
    },
    additionalCreditMetadata: creditAccountAdditionalMetadata,
    additionalInternalMetadata: internalAccountsAdditionalMetadata,
  })
  if (journal instanceof Error) {
    recordExceptionInCurrentSpan({
      error: journal,
      level: ErrorLevel.Critical,
      attributes: {
        ["error.actionRequired.message"]:
          "Check that invoice exists and is settled in lnd, confirm that receipt ledger transaction " +
          "did not get recorded, and finally unmark paid (and processed) from wallet invoice in " +
          "wallet_invoices collection.",
        ["error.actionRequired.paymentHash"]: paymentHash,
        ["error.actionRequired.pubkey]"]: walletInvoiceInsideLock.pubkey,
      },
    })
    return ProcessPendingInvoiceResult.err(journal)
  }

  // Prepare and send notification
  const recipientUser = await UsersRepository().findById(recipientAccount.kratosUserId)
  if (recipientUser instanceof Error) {
    return ProcessPendingInvoiceResult.processAsPaidWithError(recipientUser)
  }

  const walletTransaction = await getTransactionForWalletByJournalId({
    walletId: recipientWalletDescriptor.id,
    journalId: journal.journalId,
  })
  if (walletTransaction instanceof Error) {
    return ProcessPendingInvoiceResult.processAsPaidWithError(walletTransaction)
  }

  NotificationsService().sendTransaction({
    recipient: {
      accountId: recipientAccountId,
      walletId: recipientWalletDescriptor.id,
      userId: recipientUser.id,
      level: recipientAccount.level,
    },
    transaction: walletTransaction,
  })

  return ProcessPendingInvoiceResult.processAsPaid()
}
