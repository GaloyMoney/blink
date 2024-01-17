import { getTransactionForWalletByJournalId } from "./get-transaction-by-journal-id"

import { declineHeldInvoice } from "./decline-single-pending-invoice"

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

export const updatePendingInvoice = wrapAsyncToRunInSpan({
  namespace: "app.invoices",
  fnName: "updatePendingInvoice",
  fn: async ({
    walletInvoice,
    logger,
  }: {
    walletInvoice: WalletInvoiceWithOptionalLnInvoice
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

const updatePendingInvoiceBeforeFinally = async ({
  walletInvoice,
  logger,
}: {
  walletInvoice: WalletInvoiceWithOptionalLnInvoice
  logger: Logger
}): Promise<boolean | ApplicationError> => {
  addAttributesToCurrentSpan({
    paymentHash: walletInvoice.paymentHash,
    pubkey: walletInvoice.pubkey,
  })

  const walletInvoicesRepo = WalletInvoicesRepository()

  const {
    pubkey,
    paymentHash,
    recipientWalletDescriptor: recipientInvoiceWalletDescriptor,
  } = walletInvoice

  addAttributesToCurrentSpan({
    "invoices.originalRecipient": JSON.stringify(recipientInvoiceWalletDescriptor),
  })

  const pendingInvoiceLogger = logger.child({
    hash: paymentHash,
    walletId: recipientInvoiceWalletDescriptor.id,
    topic: "payment",
    protocol: "lightning",
    transactionType: "receipt",
    onUs: false,
  })

  const lndService = LndService()
  if (lndService instanceof Error) return lndService
  const lnInvoiceLookup = await lndService.lookupInvoice({ pubkey, paymentHash })
  if (lnInvoiceLookup instanceof InvoiceNotFoundError) {
    const processingCompletedInvoice =
      await walletInvoicesRepo.markAsProcessingCompleted(paymentHash)
    if (processingCompletedInvoice instanceof Error) {
      pendingInvoiceLogger.error("Unable to mark invoice as processingCompleted")
      return processingCompletedInvoice
    }
    return false
  }
  if (lnInvoiceLookup instanceof Error) return lnInvoiceLookup

  if (walletInvoice.paid) {
    pendingInvoiceLogger.info("invoice has already been processed")
    return true
  }

  const {
    lnInvoice: { description },
    roundedDownReceived: uncheckedRoundedDownReceived,
  } = lnInvoiceLookup

  if (lnInvoiceLookup.isCanceled) {
    pendingInvoiceLogger.info("invoice has been canceled")
    const processingCompletedInvoice =
      await walletInvoicesRepo.markAsProcessingCompleted(paymentHash)
    if (processingCompletedInvoice instanceof Error) {
      pendingInvoiceLogger.error("Unable to mark invoice as processingCompleted")
      return processingCompletedInvoice
    }
    return false
  }

  if (!lnInvoiceLookup.isHeld && !lnInvoiceLookup.isSettled) {
    pendingInvoiceLogger.info("invoice has not been paid yet")
    return false
  }

  // TODO: validate roundedDownReceived as user input
  const roundedDownReceived = checkedToSats(uncheckedRoundedDownReceived)
  if (roundedDownReceived instanceof Error) {
    recordExceptionInCurrentSpan({
      error: roundedDownReceived,
      level: roundedDownReceived.level,
    })
    return declineHeldInvoice({
      walletInvoice,
      logger,
    })
  }

  const receivedBtc = paymentAmountFromNumber({
    amount: roundedDownReceived,
    currency: WalletCurrency.Btc,
  })
  if (receivedBtc instanceof Error) return receivedBtc

  const lockService = LockService()
  return lockService.lockPaymentHash(paymentHash, async () =>
    lockedUpdatePendingInvoiceSteps({
      recipientWalletId: recipientInvoiceWalletDescriptor.id,
      paymentHash,
      receivedBtc,
      description,
      isSettledInLnd: lnInvoiceLookup.isSettled,
      logger,
    }),
  )
}

const lockedUpdatePendingInvoiceSteps = async ({
  paymentHash,
  recipientWalletId,
  receivedBtc,
  description,
  isSettledInLnd,
  logger,
}: {
  paymentHash: PaymentHash
  recipientWalletId: WalletId
  receivedBtc: BtcPaymentAmount
  description: string
  isSettledInLnd: boolean
  logger: Logger
}) => {
  const walletInvoices = WalletInvoicesRepository()

  const walletInvoiceInsideLock = await walletInvoices.findByPaymentHash(paymentHash)
  if (walletInvoiceInsideLock instanceof CouldNotFindError) {
    logger.error({ paymentHash }, "WalletInvoice doesn't exist")
    return false
  }
  if (walletInvoiceInsideLock instanceof Error) return walletInvoiceInsideLock
  if (walletInvoiceInsideLock.paid) {
    logger.info("invoice has already been processed")
    return true
  }

  // Prepare metadata and record transaction
  const recipientInvoiceWallet = await WalletsRepository().findById(recipientWalletId)
  if (recipientInvoiceWallet instanceof Error) return recipientInvoiceWallet
  const { accountId: recipientAccountId } = recipientInvoiceWallet

  const accountWallets =
    await WalletsRepository().findAccountWalletsByAccountId(recipientAccountId)
  if (accountWallets instanceof Error) return accountWallets

  const receivedWalletInvoice = await WalletInvoiceReceiver({
    walletInvoice: walletInvoiceInsideLock,
    receivedBtc,
    recipientWalletDescriptors: accountWallets,
  }).withConversion({
    mid: { usdFromBtc: usdFromBtcMidPriceFn },
    hedgeBuyUsd: { usdFromBtc: DealerPriceService().getCentsFromSatsForImmediateBuy },
  })
  if (receivedWalletInvoice instanceof Error) return receivedWalletInvoice

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

  if (!isSettledInLnd) {
    const lndService = LndService()
    if (lndService instanceof Error) return lndService
    const invoiceSettled = await lndService.settleInvoice({
      pubkey: walletInvoiceInsideLock.pubkey,
      secret: walletInvoiceInsideLock.secret,
    })
    if (invoiceSettled instanceof Error) return invoiceSettled
  }

  const invoicePaid = await walletInvoices.markAsPaid(paymentHash)
  if (invoicePaid instanceof Error) return invoicePaid

  const recipientAccount = await AccountsRepository().findById(recipientAccountId)
  if (recipientAccount instanceof Error) return recipientAccount
  const { displayCurrency: recipientDisplayCurrency } = recipientAccount
  const displayPriceRatio = await getCurrentPriceAsDisplayPriceRatio({
    currency: recipientDisplayCurrency,
  })
  if (displayPriceRatio instanceof Error) return displayPriceRatio

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

  //TODO: add displayCurrency: displayPaymentAmount.currency,
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
  if (journal instanceof Error) return journal

  // Prepare and send notification
  const recipientUser = await UsersRepository().findById(recipientAccount.kratosUserId)
  if (recipientUser instanceof Error) return recipientUser

  const walletTransaction = await getTransactionForWalletByJournalId({
    walletId: recipientWalletDescriptor.id,
    journalId: journal.journalId,
  })
  if (walletTransaction instanceof Error) return walletTransaction

  const result = await NotificationsService().sendTransaction({
    recipient: {
      accountId: recipientAccountId,
      walletId: recipientWalletDescriptor.id,
      deviceTokens: recipientUser.deviceTokens,
      language: recipientUser.language,
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

  return true
}
