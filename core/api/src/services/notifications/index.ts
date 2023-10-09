import {
  handleCommonNotificationErrors,
  PushNotificationsService,
} from "./push-notifications"

import { createPushNotificationContent } from "./create-push-notification-content"

import { toSats } from "@/domain/bitcoin"
import { WalletCurrency } from "@/domain/shared"
import { toCents, UsdDisplayCurrency } from "@/domain/fiat"
import { customPubSubTrigger, PubSubDefaultTriggers } from "@/domain/pubsub"
import {
  GaloyNotificationCategories,
  NotificationsServiceError,
  NotificationType,
} from "@/domain/notifications"

import { PubSubService } from "@/services/pubsub"
import { wrapAsyncFunctionsToRunInSpan } from "@/services/tracing"

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
    recipientNotificationSettings,
    recipientLanguage,
  }: LightningTxReceivedArgs): Promise<true | NotificationsServiceError> => {
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
        const notificationCategory = GaloyNotificationCategories.Payments

        const { title, body } = createPushNotificationContent({
          type: NotificationType.LnInvoicePaid,
          userLanguage: recipientLanguage,
          amount: paymentAmount,
          displayAmount: displayPaymentAmount,
        })

        const result = await pushNotification.sendFilteredNotification({
          deviceTokens: recipientDeviceTokens,
          title,
          body,
          notificationCategory,
          notificationSettings: recipientNotificationSettings,
        })

        if (result instanceof NotificationsServiceError) {
          return result
        }

        return true
      }

      return true
    } catch (err) {
      return handleCommonNotificationErrors(err)
    }
  }

  const intraLedgerTxReceived = async ({
    recipientAccountId,
    recipientWalletId,
    paymentAmount,
    displayPaymentAmount,
    recipientDeviceTokens,
    recipientNotificationSettings,
    recipientLanguage,
  }: IntraLedgerTxReceivedArgs): Promise<true | NotificationsServiceError> => {
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
        displayAmount: displayPaymentAmount
          ? displayPaymentAmount?.displayInMajor
          : undefined,
        displayCurrency: displayPaymentAmount?.currency,
      }

      // TODO: remove deprecated fields
      if (displayPaymentAmount)
        data["displayCurrencyPerSat"] =
          Number(displayPaymentAmount.amountInMinor) / Number(paymentAmount.amount)
      if (paymentAmount.currency === WalletCurrency.Btc)
        data["sats"] = toSats(paymentAmount.amount)
      if (paymentAmount.currency === WalletCurrency.Usd)
        data["cents"] = toCents(paymentAmount.amount)

      pubsub.publish({
        trigger: accountUpdatedTrigger,
        payload: { intraLedger: data },
      })

      if (recipientDeviceTokens && recipientDeviceTokens.length > 0) {
        const notificationCategory = GaloyNotificationCategories.Payments

        const { title, body } = createPushNotificationContent({
          type: NotificationType.IntraLedgerReceipt,
          userLanguage: recipientLanguage,
          amount: paymentAmount,
          displayAmount: displayPaymentAmount,
        })

        const result = await pushNotification.sendFilteredNotification({
          deviceTokens: recipientDeviceTokens,
          title,
          body,
          notificationCategory,
          notificationSettings: recipientNotificationSettings,
        })

        if (result instanceof NotificationsServiceError) {
          return result
        }

        return true
      }

      return true
    } catch (err) {
      return handleCommonNotificationErrors(err)
    }
  }

  const sendOnChainNotification = async ({
    type,
    accountId,
    walletId,
    paymentAmount,
    displayPaymentAmount,
    deviceTokens,
    notificationSettings,
    language,
    txHash,
  }: {
    type: NotificationType
    accountId: AccountId
    walletId: WalletId
    paymentAmount: PaymentAmount<WalletCurrency>
    displayPaymentAmount?: DisplayAmount<DisplayCurrency>
    deviceTokens: DeviceToken[]
    notificationSettings: NotificationSettings
    language: UserLanguageOrEmpty
    txHash: OnChainTxHash
  }): Promise<true | NotificationsServiceError> => {
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
        displayAmount: displayPaymentAmount?.displayInMajor,
        displayCurrency: displayPaymentAmount?.currency,
        txHash,
      }

      // TODO: remove deprecated fields
      if (displayPaymentAmount)
        data["displayCurrencyPerSat"] =
          Number(displayPaymentAmount.amountInMinor) / Number(paymentAmount.amount)

      pubsub.publish({
        trigger: accountUpdatedTrigger,
        payload: { transaction: data },
      })

      if (deviceTokens.length > 0) {
        const notificationCategory = GaloyNotificationCategories.Payments

        const { title, body } = createPushNotificationContent({
          type,
          userLanguage: language,
          amount: paymentAmount,
          displayAmount: displayPaymentAmount,
        })

        const result = await pushNotification.sendFilteredNotification({
          deviceTokens,
          title,
          body,
          notificationCategory,
          notificationSettings,
        })

        if (result instanceof NotificationsServiceError) {
          return result
        }

        return true
      }

      return true
    } catch (err) {
      return handleCommonNotificationErrors(err)
    }
  }

  const onChainTxReceived = async ({
    recipientAccountId,
    recipientWalletId,
    paymentAmount,
    displayPaymentAmount,
    recipientDeviceTokens,
    recipientNotificationSettings,
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
      notificationSettings: recipientNotificationSettings,
      language: recipientLanguage,
      txHash,
    })

  const onChainTxReceivedPending = async ({
    recipientAccountId,
    recipientWalletId,
    paymentAmount,
    displayPaymentAmount,
    recipientDeviceTokens,
    recipientNotificationSettings,
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
      notificationSettings: recipientNotificationSettings,
      language: recipientLanguage,
      txHash,
    })

  const onChainTxSent = async ({
    senderAccountId,
    senderWalletId,
    paymentAmount,
    displayPaymentAmount,
    senderDeviceTokens,
    senderNotificationSettings,
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
      notificationSettings: senderNotificationSettings,
      language: senderLanguage,
      txHash,
    })

  const priceUpdate = <C extends DisplayCurrency>({
    pricePerSat,
    pricePerUsdCent,
  }: PriceUpdateArgs<C>) => {
    const timestamp = pricePerSat.timestamp
    const displayCurrency = pricePerSat.currency
    const payload = {
      timestamp,
      displayCurrency,
      pricePerSat: pricePerSat.price,
      pricePerUsdCent: pricePerUsdCent.price,
    }

    const priceUpdateTrigger = customPubSubTrigger({
      event: PubSubDefaultTriggers.PriceUpdate,
      suffix: displayCurrency,
    })
    pubsub.publish({ trigger: priceUpdateTrigger, payload })

    const userPriceUpdateTrigger = customPubSubTrigger({
      event: PubSubDefaultTriggers.UserPriceUpdate,
      suffix: displayCurrency,
    })
    if (displayCurrency === UsdDisplayCurrency) {
      pubsub.publish({ trigger: userPriceUpdateTrigger, payload: { price: payload } })
    }
    pubsub.publish({
      trigger: userPriceUpdateTrigger,
      payload: { realtimePrice: payload },
    })
  }

  const sendBalance = async ({
    balanceAmount,
    deviceTokens,
    notificationSettings,
    displayBalanceAmount,
    recipientLanguage,
  }: SendBalanceArgs): Promise<true | NotificationsServiceError> => {
    const hasDeviceTokens = deviceTokens && deviceTokens.length > 0
    if (!hasDeviceTokens) return true

    try {
      const notificationCategory = GaloyNotificationCategories.Payments

      const { title, body } = createPushNotificationContent({
        type: "balance",
        userLanguage: recipientLanguage,
        amount: balanceAmount,
        displayAmount: displayBalanceAmount,
      })

      const result = await pushNotification.sendFilteredNotification({
        deviceTokens,
        title,
        body,
        notificationCategory,
        notificationSettings,
      })

      if (result instanceof NotificationsServiceError) {
        return result
      }

      return true
    } catch (err) {
      return handleCommonNotificationErrors(err)
    }
  }

  const adminPushNotificationSend = async ({
    deviceTokens,
    title,
    body,
    data,
  }: SendPushNotificationArgs): Promise<true | NotificationsServiceError> => {
    const hasDeviceTokens = deviceTokens && deviceTokens.length > 0
    if (!hasDeviceTokens) return true

    try {
      return pushNotification.sendNotification({
        deviceTokens,
        title,
        body,
        data,
      })
    } catch (err) {
      return handleCommonNotificationErrors(err)
    }
  }

  const adminPushNotificationFilteredSend = async ({
    title,
    body,
    data,
    deviceTokens,
    notificationSettings,
    notificationCategory,
  }: SendFilteredPushNotificationArgs): Promise<true | NotificationsServiceError> => {
    const hasDeviceTokens = deviceTokens && deviceTokens.length > 0
    if (!hasDeviceTokens) return true

    try {
      const result = await pushNotification.sendFilteredNotification({
        deviceTokens,
        title,
        body,
        data,
        notificationSettings,
        notificationCategory,
      })

      if (result instanceof NotificationsServiceError) {
        return result
      }

      return true
    } catch (err) {
      return handleCommonNotificationErrors(err)
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
        adminPushNotificationSend,
        adminPushNotificationFilteredSend,
      },
    }),
  }
}
