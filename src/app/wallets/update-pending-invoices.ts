import { removeDeviceTokens } from "@app/users/remove-device-tokens"
import { getCurrentPriceAsDisplayPriceRatio, usdFromBtcMidPriceFn } from "@app/prices"

import {
  CouldNotFindError,
  CouldNotFindWalletInvoiceError,
  InvalidNonHodlInvoiceError,
} from "@domain/errors"
import { checkedToSats } from "@domain/bitcoin"
import { DisplayAmountsConverter } from "@domain/fiat"
import {
  InvoiceNotFoundError,
  invoiceExpirationForCurrency,
} from "@domain/bitcoin/lightning"
import { paymentAmountFromNumber, WalletCurrency } from "@domain/shared"
import { WalletInvoiceReceiver } from "@domain/wallet-invoices/wallet-invoice-receiver"
import { DeviceTokensNotRegisteredNotificationsServiceError } from "@domain/notifications"

import {
  addAttributesToCurrentSpan,
  recordExceptionInCurrentSpan,
  wrapAsyncToRunInSpan,
} from "@services/tracing"
import {
  AccountsRepository,
  WalletInvoicesRepository,
  WalletsRepository,
  UsersRepository,
} from "@services/mongoose"
import { LndService } from "@services/lnd"
import { LockService } from "@services/lock"
import * as LedgerFacade from "@services/ledger/facade"
import { DealerPriceService } from "@services/dealer-price"
import { NotificationsService } from "@services/notifications"

import { elapsedSinceTimestamp, runInParallel } from "@utils"
import { CallbackEventType } from "@domain/callback"
import { AccountLevel } from "@domain/accounts"
import { CallbackService } from "@services/svix"
import { getCallbackServiceConfig } from "@config"
import { toDisplayBaseAmount } from "@domain/payments"

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

      const { pubkey, paymentHash, recipientWalletDescriptor, createdAt } = walletInvoice
      const expiresIn = invoiceExpirationForCurrency(
        recipientWalletDescriptor.currency,
        createdAt,
      )
      if (
        recipientWalletDescriptor.currency === WalletCurrency.Usd &&
        expiresIn.getTime() < Date.now()
      ) {
        await declineHeldInvoice({ pubkey, paymentHash, logger })
        return
      }

      await updatePendingInvoice({ walletInvoice, logger })
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

const dealer = DealerPriceService()

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

  const {
    pubkey,
    paymentHash,
    secret,
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

  if (walletInvoice.paid) {
    pendingInvoiceLogger.info("invoice has already been processed")
    return true
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
      pubkey: walletInvoice.pubkey,
      paymentHash: walletInvoice.paymentHash,
      logger,
    })
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
    if (invoiceToUpdate.paid) {
      pendingInvoiceLogger.info("invoice has already been processed")
      return true
    }

    // Prepare metadata and record transaction
    const recipientInvoiceWallet = await WalletsRepository().findById(
      recipientInvoiceWalletDescriptor.id,
    )
    if (recipientInvoiceWallet instanceof Error) return recipientInvoiceWallet
    const { accountId: recipientAccountId } = recipientInvoiceWallet

    const accountWallets =
      await WalletsRepository().findAccountWalletsByAccountId(recipientAccountId)
    if (accountWallets instanceof Error) return accountWallets

    const receivedWalletInvoice = await WalletInvoiceReceiver({
      walletInvoice,
      receivedBtc,
      recipientWalletDescriptors: accountWallets,
    }).withConversion({
      mid: { usdFromBtc: usdFromBtcMidPriceFn },
      hedgeBuyUsd: { usdFromBtc: dealer.getCentsFromSatsForImmediateBuy },
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

    if (!lnInvoiceLookup.isSettled) {
      const invoiceSettled = await lndService.settleInvoice({ pubkey, secret })
      if (invoiceSettled instanceof Error) return invoiceSettled
    }

    const invoicePaid = await walletInvoicesRepo.markAsPaid(paymentHash)
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
      pubkey: walletInvoice.pubkey,
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
    const result = await LedgerFacade.recordReceiveOffChain({
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
    if (result instanceof Error) return result

    // Prepare and send notification
    const recipientUser = await UsersRepository().findById(recipientAccount.kratosUserId)
    if (recipientUser instanceof Error) return recipientUser

    const notificationResult = await NotificationsService().lightningTxReceived({
      recipientAccountId,
      recipientWalletId: recipientWalletDescriptor.id,
      paymentAmount: receivedWalletInvoice.receivedAmount(),
      displayPaymentAmount,
      paymentHash,
      recipientDeviceTokens: recipientUser.deviceTokens,
      recipientNotificationSettings: recipientAccount.notificationSettings,
      recipientLanguage: recipientUser.language,
    })

    if (
      notificationResult instanceof DeviceTokensNotRegisteredNotificationsServiceError
    ) {
      await removeDeviceTokens({
        userId: recipientUser.id,
        deviceTokens: notificationResult.tokens,
      })
    }

    if (
      recipientAccount.level === AccountLevel.One ||
      recipientAccount.level === AccountLevel.Two
    ) {
      const callbackService = CallbackService(getCallbackServiceConfig())
      callbackService.sendMessage({
        accountUuid: recipientAccount.uuid,
        eventType: CallbackEventType.ReceiveLightning,
        payload: {
          // FIXME: [0] might not be correct
          txid: result.transactionIds[0],
        },
      })
    }

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
