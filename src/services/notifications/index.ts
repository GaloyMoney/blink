import { toCents } from "@domain/fiat"
import { toSats } from "@domain/bitcoin"
import { WalletCurrency } from "@domain/shared"
import { customPubSubTrigger, PubSubDefaultTriggers } from "@domain/pubsub"
import {
  NotificationsServiceError,
  NotificationType,
  UnknownNotificationsServiceError,
} from "@domain/notifications"

import { PubSubService } from "@services/pubsub"
import { wrapAsyncFunctionsToRunInSpan } from "@services/tracing"

import { PushNotificationsService } from "./push-notifications"
import { createPushNotificationContent } from "./create-push-notification-content"

export const NotificationsService = (): INotificationsService => {
  const pubsub = PubSubService()
  const pushNotification = PushNotificationsService()

  const lightningTxReceived = async ({
    recipientAccountId,
    recipientWalletId,
    paymentAmount,
    displayPaymentAmount,
    paymentHash,
    recipientDeviceTokens,
    recipientLanguage,
  }: LightningTxReceivedArgs): Promise<void | NotificationsServiceError> => {
    try {
      // Notify public subscribers (via GraphQL subscription if any)
      const lnPaymentStatusTrigger = customPubSubTrigger({
        event: PubSubDefaultTriggers.LnPaymentStatus,
        suffix: paymentHash,
      })
      pubsub.publish({
        trigger: lnPaymentStatusTrigger,
        payload: { status: "PAID" },
      })

      // Notify the recipient (via GraphQL subscription if any)
      const accountUpdatedTrigger = customPubSubTrigger({
        event: PubSubDefaultTriggers.AccountUpdate,
        suffix: recipientAccountId,
      })
      pubsub.publish({
        trigger: accountUpdatedTrigger,
        payload: {
          invoice: {
            walletId: recipientWalletId,
            paymentHash,
            status: "PAID",
          },
        },
      })

      if (recipientDeviceTokens && recipientDeviceTokens.length > 0) {
        const { title, body } = createPushNotificationContent({
          type: NotificationType.LnInvoicePaid,
          userLanguage: recipientLanguage,
          amount: paymentAmount,
          displayAmount: displayPaymentAmount,
        })

        // Do not await this call for quicker processing
        pushNotification.sendNotification({
          deviceTokens: recipientDeviceTokens,
          title,
          body,
        })
      }
    } catch (err) {
      return new UnknownNotificationsServiceError(err.message || err)
    }
  }

  const intraLedgerTxReceived = async ({
    recipientAccountId,
    recipientWalletId,
    paymentAmount,
    displayPaymentAmount,
    recipientDeviceTokens,
    recipientLanguage,
  }: IntraLedgerTxReceivedArgs): Promise<void | NotificationsServiceError> => {
    try {
      // Notify the recipient (via GraphQL subscription if any)
      const accountUpdatedTrigger = customPubSubTrigger({
        event: PubSubDefaultTriggers.AccountUpdate,
        suffix: recipientAccountId,
      })
      const data: NotificationsDataObject = {
        walletId: recipientWalletId,
        txNotificationType: NotificationType.IntraLedgerReceipt,
        amount: paymentAmount.amount,
        currency: paymentAmount.currency,
        displayAmount: displayPaymentAmount?.amount,
        displayCurrency: displayPaymentAmount?.currency,
      }

      // TODO: remove deprecated fields
      if (displayPaymentAmount)
        data["displayCurrencyPerSat"] =
          displayPaymentAmount.amount / Number(paymentAmount.amount)
      if (paymentAmount.currency === WalletCurrency.Btc)
        data["sats"] = toSats(paymentAmount.amount)
      if (paymentAmount.currency === WalletCurrency.Usd)
        data["cents"] = toCents(paymentAmount.amount)

      pubsub.publish({
        trigger: accountUpdatedTrigger,
        payload: { intraLedger: data },
      })

      if (recipientDeviceTokens && recipientDeviceTokens.length > 0) {
        const { title, body } = createPushNotificationContent({
          type: NotificationType.IntraLedgerReceipt,
          userLanguage: recipientLanguage,
          amount: paymentAmount,
          displayAmount: displayPaymentAmount,
        })

        // Do not await this call for quicker processing
        pushNotification.sendNotification({
          deviceTokens: recipientDeviceTokens,
          title,
          body,
        })
      }
    } catch (err) {
      return new UnknownNotificationsServiceError(err.message || err)
    }
  }

  const sendOnChainNotification = async ({
    type,
    accountId,
    walletId,
    paymentAmount,
    displayPaymentAmount,
    deviceTokens,
    language,
    txHash,
  }: {
    type: NotificationType
    accountId: AccountId
    walletId: WalletId
    paymentAmount: PaymentAmount<WalletCurrency>
    displayPaymentAmount?: DisplayPaymentAmount<DisplayCurrency>
    deviceTokens: DeviceToken[]
    language: UserLanguageOrEmpty
    txHash: OnChainTxHash
  }): Promise<void | NotificationsServiceError> => {
    try {
      // Notify the recipient (via GraphQL subscription if any)
      const accountUpdatedTrigger = customPubSubTrigger({
        event: PubSubDefaultTriggers.AccountUpdate,
        suffix: accountId,
      })
      const data: NotificationsDataObject = {
        walletId,
        txNotificationType: type,
        amount: paymentAmount.amount,
        currency: paymentAmount.currency,
        displayAmount: displayPaymentAmount?.amount,
        displayCurrency: displayPaymentAmount?.currency,
        txHash,
      }

      // TODO: remove deprecated fields
      if (displayPaymentAmount)
        data["displayCurrencyPerSat"] =
          displayPaymentAmount.amount / Number(paymentAmount.amount)

      pubsub.publish({
        trigger: accountUpdatedTrigger,
        payload: { transaction: data },
      })

      if (deviceTokens.length > 0) {
        const { title, body } = createPushNotificationContent({
          type,
          userLanguage: language,
          amount: paymentAmount,
          displayAmount: displayPaymentAmount,
        })

        // Do not await this call for quicker processing
        pushNotification.sendNotification({
          deviceTokens,
          title,
          body,
        })
      }
    } catch (err) {
      return new UnknownNotificationsServiceError(err.message || err)
    }
  }

  const onChainTxReceived = async ({
    recipientAccountId,
    recipientWalletId,
    paymentAmount,
    displayPaymentAmount,
    recipientDeviceTokens,
    recipientLanguage,
    txHash,
  }: OnChainTxReceivedArgs) =>
    sendOnChainNotification({
      type: NotificationType.OnchainReceipt,
      accountId: recipientAccountId,
      walletId: recipientWalletId,
      paymentAmount,
      displayPaymentAmount,
      deviceTokens: recipientDeviceTokens,
      language: recipientLanguage,
      txHash,
    })

  const onChainTxReceivedPending = async ({
    recipientAccountId,
    recipientWalletId,
    paymentAmount,
    displayPaymentAmount,
    recipientDeviceTokens,
    recipientLanguage,
    txHash,
  }: OnChainTxReceivedPendingArgs) =>
    sendOnChainNotification({
      type: NotificationType.OnchainReceiptPending,
      accountId: recipientAccountId,
      walletId: recipientWalletId,
      paymentAmount,
      displayPaymentAmount,
      deviceTokens: recipientDeviceTokens,
      language: recipientLanguage,
      txHash,
    })

  const onChainTxSent = async ({
    senderAccountId,
    senderWalletId,
    paymentAmount,
    displayPaymentAmount,
    senderDeviceTokens,
    senderLanguage,
    txHash,
  }: OnChainTxSentArgs) =>
    sendOnChainNotification({
      type: NotificationType.OnchainPayment,
      accountId: senderAccountId,
      walletId: senderWalletId,
      paymentAmount,
      displayPaymentAmount,
      deviceTokens: senderDeviceTokens,
      language: senderLanguage,
      txHash,
    })

  const priceUpdate = (displayCurrencyPerSat: DisplayCurrencyPerSat) => {
    const payload = { satUsdCentPrice: 100 * displayCurrencyPerSat }
    pubsub.publish({ trigger: PubSubDefaultTriggers.PriceUpdate, payload })
    pubsub.publish({
      trigger: PubSubDefaultTriggers.UserPriceUpdate,
      payload: {
        price: payload,
      },
    })
  }

  const sendBalance = async ({
    balanceAmount,
    deviceTokens,
    displayBalanceAmount,
    recipientLanguage,
  }: SendBalanceArgs): Promise<void | NotificationsServiceError> => {
    const hasDeviceTokens = deviceTokens && deviceTokens.length > 0
    if (!hasDeviceTokens) return

    try {
      const { title, body } = createPushNotificationContent({
        type: "balance",
        userLanguage: recipientLanguage,
        amount: balanceAmount,
        displayAmount: displayBalanceAmount,
      })

      // NB: await for this notification to avoid timeout issue?
      // it seems firebase is batching the processing otherwise but this eventually timeout with
      // Error: Error while making request: timeout of 15000ms exceeded.\n
      // at /app/node_modules/firebase-admin/lib/utils/api-request.js:176:23\n
      // at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n
      // at async Object.sendNotification (/app/lib/services/notifications/push-notifications.js:56:30)
      await pushNotification.sendNotification({
        deviceTokens,
        title,
        body,
      })
    } catch (err) {
      return new UnknownNotificationsServiceError(err.message || err)
    }
  }

  // trace everything except price update because it runs every 30 seconds
  return {
    priceUpdate,
    ...wrapAsyncFunctionsToRunInSpan({
      namespace: "services.notifications",
      fns: {
        lightningTxReceived,
        intraLedgerTxReceived,
        onChainTxReceived,
        onChainTxReceivedPending,
        onChainTxSent,
        sendBalance,
      },
    }),
  }
}
