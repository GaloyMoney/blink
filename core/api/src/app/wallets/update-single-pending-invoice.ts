import { getTransactionForWalletByJournalId } from "./get-transaction-by-journal-id"

import { processPendingInvoiceForDecline } from "./decline-single-pending-invoice"

import {
  ProcessPendingInvoiceResult,
  ProcessedReason,
} from "./process-pending-invoice-result"

import { InvalidInvoiceProcessingStateError } from "./errors"

import { removeDeviceTokens } from "@/app/users/remove-device-tokens"
import { getCurrentPriceAsDisplayPriceRatio, usdFromBtcMidPriceFn } from "@/app/prices"

import { CouldNotFindError, CouldNotFindWalletInvoiceError } from "@/domain/errors"
import { checkedToSats } from "@/domain/bitcoin"
import { DisplayAmountsConverter } from "@/domain/fiat"
import { InvoiceNotFoundError } from "@/domain/bitcoin/lightning"
import { paymentAmountFromNumber, WalletCurrency } from "@/domain/shared"
import { WalletInvoiceReceiver } from "@/domain/wallet-invoices/wallet-invoice-receiver"
import { DeviceTokensNotRegisteredNotificationsServiceError } from "@/domain/notifications"

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
    switch (true) {
      case walletInvoiceBeforeProcessing.paid:
        return true

      case result.markProcessedAsCanceledOrExpired():
        marked = await walletInvoices.markAsProcessingCompleted(paymentHash)
        if (marked instanceof Error) {
          pendingInvoiceLogger.error("Unable to mark invoice as processingCompleted")
          return marked
        }
        return true

      case result.markProcessedAsPaid():
        marked = await walletInvoices.markAsPaid(paymentHash)
        if (
          marked instanceof Error &&
          !(marked instanceof CouldNotFindWalletInvoiceError)
        ) {
          return marked
        }
        return result.error() || true

      case result.reason() === ProcessedReason.InvoiceNotPaidYet:
        return true

      case !!result.error():
        return result.error() as ApplicationError

      default:
        return new InvalidInvoiceProcessingStateError(JSON.stringify(result._state()))
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
    recordExceptionInCurrentSpan({ error: lndService })
    return ProcessPendingInvoiceResult.err(lndService)
  }

  const lnInvoiceLookup = await lndService.lookupInvoice({ pubkey, paymentHash })
  if (lnInvoiceLookup instanceof InvoiceNotFoundError) {
    return ProcessPendingInvoiceResult.processAsCanceledOrExpired(
      ProcessedReason.InvoiceNotFound,
    )
  }
  if (lnInvoiceLookup instanceof Error) {
    return ProcessPendingInvoiceResult.processAsPaidWithError(lnInvoiceLookup)
  }

  // Check paid on wallet invoice after lnd invoice has been successfully fetched
  if (walletInvoice.paid) {
    pendingInvoiceLogger.info("invoice has already been processed")
    return ProcessPendingInvoiceResult.processAsPaid()
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
      level: roundedDownReceived.level,
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
    return ProcessPendingInvoiceResult.processAsPaidWithError(receivedBtc)
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
    return ProcessPendingInvoiceResult.processAsPaidWithError(walletInvoiceInsideLock)
  }
  if (walletInvoiceInsideLock.paid) {
    logger.info("invoice has already been processed")
    return ProcessPendingInvoiceResult.processAsPaid()
  }

  // Prepare ledger transaction metadata
  const recipientInvoiceWallet = await WalletsRepository().findById(recipientWalletId)
  if (recipientInvoiceWallet instanceof Error) {
    return ProcessPendingInvoiceResult.processAsPaidWithError(recipientInvoiceWallet)
  }
  const { accountId: recipientAccountId } = recipientInvoiceWallet

  const accountWallets =
    await WalletsRepository().findAccountWalletsByAccountId(recipientAccountId)
  if (accountWallets instanceof Error) {
    return ProcessPendingInvoiceResult.processAsPaidWithError(accountWallets)
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
    return ProcessPendingInvoiceResult.processAsPaidWithError(receivedWalletInvoice)
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
    return ProcessPendingInvoiceResult.processAsPaidWithError(recipientAccount)
  }
  const { displayCurrency: recipientDisplayCurrency } = recipientAccount
  const displayPriceRatio = await getCurrentPriceAsDisplayPriceRatio({
    currency: recipientDisplayCurrency,
  })
  if (displayPriceRatio instanceof Error) {
    return ProcessPendingInvoiceResult.processAsPaidWithError(displayPriceRatio)
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
      recordExceptionInCurrentSpan({ error: lndService })
      return ProcessPendingInvoiceResult.err(lndService)
    }
    // Returns 'true' on re-runs if invoice is already settled in lnd
    const invoiceSettled = await lndService.settleInvoice({
      pubkey: walletInvoiceInsideLock.pubkey,
      secret: walletInvoiceInsideLock.secret,
    })
    if (invoiceSettled instanceof Error) {
      logger.error({ paymentHash }, "Unable to settleInvoice")
      recordExceptionInCurrentSpan({ error: invoiceSettled })
      return ProcessPendingInvoiceResult.err(invoiceSettled)
    }
  }

  // Mark paid and record ledger transaction
  const invoicePaid = await walletInvoices.markAsPaid(paymentHash)
  if (invoicePaid instanceof Error) {
    return ProcessPendingInvoiceResult.processAsPaidWithError(invoicePaid)
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
    return ProcessPendingInvoiceResult.processAsPaidWithError(journal)
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

  const result = await NotificationsService().sendTransaction({
    recipient: {
      accountId: recipientAccountId,
      walletId: recipientWalletDescriptor.id,
      userId: recipientUser.id,
      level: recipientAccount.level,
    },
    transaction: walletTransaction,
  })

  if (result instanceof DeviceTokensNotRegisteredNotificationsServiceError) {
    await removeDeviceTokens({
      userId: recipientUser.id,
      deviceTokens: result.tokens,
    })
  }

  return ProcessPendingInvoiceResult.processAsPaid()
}
