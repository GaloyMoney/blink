import {
  grpcNotificationSettingsToNotificationSettings,
  notificationCategoryToGrpcNotificationCategory,
  notificationChannelToGrpcNotificationChannel,
} from "./convert"

import {
  TransactionType as ProtoTransactionType,
  Money as ProtoMoney,
  LocalizedPushContent,
  AddPushDeviceTokenRequest,
  DisableNotificationCategoryRequest,
  DisableNotificationChannelRequest,
  EnableNotificationCategoryRequest,
  EnableNotificationChannelRequest,
  GetNotificationSettingsRequest,
  RemovePushDeviceTokenRequest,
  UpdateEmailAddressRequest,
  RemoveEmailAddressRequest,
  UpdateUserLocaleRequest,
  HandleNotificationEventRequest,
  NotificationEvent,
  TransactionOccurred,
  MarketingNotificationTriggered,
} from "./proto/notifications_pb"

import * as notificationsGrpc from "./grpc-client"

import { handleCommonNotificationErrors } from "./errors"

import { PushNotificationsService } from "./push-notifications"

import { createPushNotificationContent } from "./create-push-notification-content"

import { getCallbackServiceConfig } from "@/config"

import {
  GaloyNotificationCategories,
  NotificationsServiceError,
  NotificationType,
  UnknownNotificationsServiceError,
} from "@/domain/notifications"
import { toSats } from "@/domain/bitcoin"
import { AccountLevel } from "@/domain/accounts"
import { WalletCurrency } from "@/domain/shared"
import { TxStatus } from "@/domain/wallets/tx-status"
import { CallbackEventType } from "@/domain/callback"
import { CallbackError } from "@/domain/callback/errors"
import { WalletInvoiceStatus } from "@/domain/wallet-invoices"
import { customPubSubTrigger, PubSubDefaultTriggers } from "@/domain/pubsub"
import { majorToMinorUnit, toCents, UsdDisplayCurrency } from "@/domain/fiat"

import { PubSubService } from "@/services/pubsub"
import { CallbackService } from "@/services/svix"
import { wrapAsyncFunctionsToRunInSpan } from "@/services/tracing"

export const NotificationsService = (): INotificationsService => {
  const pubsub = PubSubService()
  const pushNotification = PushNotificationsService()
  const callbackService = CallbackService(getCallbackServiceConfig())

  const getUserNotificationSettings = async (
    userId: UserId,
  ): Promise<NotificationSettings | NotificationsServiceError> => {
    try {
      const request = new GetNotificationSettingsRequest()
      request.setUserId(userId)
      const response = await notificationsGrpc.getNotificationSettings(
        request,
        notificationsGrpc.notificationsMetadata,
      )

      const notificationSettings = grpcNotificationSettingsToNotificationSettings(
        response.getNotificationSettings(),
      )

      return notificationSettings
    } catch (err) {
      return handleCommonNotificationErrors(err)
    }
  }

  const sendTransactionPubSubNotification = async ({
    recipient,
    transaction,
  }: NotificatioSendTransactionArgs): Promise<void | PubSubServiceError> => {
    try {
      const type = getPubSubNotificationEventType(transaction)
      if (!type) return

      if (type === NotificationType.LigtningReceipt) {
        const lnTx = transaction as WalletLnTransaction
        const paymentHash = lnTx.initiationVia.paymentHash
        // Notify public subscribers
        const lnPaymentStatusTrigger = customPubSubTrigger({
          event: PubSubDefaultTriggers.LnPaymentStatus,
          suffix: paymentHash,
        })

        // Notify the recipient
        const accountUpdatedTrigger = customPubSubTrigger({
          event: PubSubDefaultTriggers.AccountUpdate,
          suffix: recipient.accountId,
        })
        const result = Promise.all([
          pubsub.publish({
            trigger: lnPaymentStatusTrigger,
            payload: { paymentHash, status: WalletInvoiceStatus.Paid },
          }),
          pubsub.publish({
            trigger: accountUpdatedTrigger,
            payload: {
              invoice: {
                walletId: recipient.walletId,
                paymentHash,
                status: WalletInvoiceStatus.Paid,
                transaction,
              },
            },
          }),
        ])
        return result.then((p) => {
          const error = p.find((p) => p instanceof Error)
          if (error) return error
        })
      }

      if (type === NotificationType.IntraLedgerReceipt) {
        const intraLedgerTx = transaction as IntraLedgerTransaction
        const accountUpdatedTrigger = customPubSubTrigger({
          event: PubSubDefaultTriggers.AccountUpdate,
          suffix: recipient.accountId,
        })
        const data: NotificationsDataObject = {
          walletId: recipient.walletId,
          txNotificationType: NotificationType.IntraLedgerReceipt,
          amount: intraLedgerTx.settlementAmount,
          currency: intraLedgerTx.settlementCurrency,
          displayAmount: intraLedgerTx.settlementDisplayAmount,
          displayCurrency: intraLedgerTx.settlementDisplayPrice.displayCurrency,
          transaction,
        }

        // TODO: remove deprecated fields
        if (data.displayAmount) {
          const { base, offset } = intraLedgerTx.settlementDisplayPrice
          data["displayCurrencyPerSat"] = Math.round(Number(base * 10n ** offset))
        }
        if (data.currency === WalletCurrency.Btc) data["sats"] = toSats(data.amount)
        if (data.currency === WalletCurrency.Usd) data["cents"] = toCents(data.amount)

        return pubsub.publish({
          trigger: accountUpdatedTrigger,
          payload: { intraLedger: data },
        })
      }

      if (
        type === NotificationType.OnchainPayment ||
        type === NotificationType.OnchainReceipt ||
        type === NotificationType.OnchainReceiptPending
      ) {
        const onchainTx = transaction as
          | WalletOnChainSettledTransaction
          | WalletLegacyOnChainSettledTransaction

        const accountUpdatedTrigger = customPubSubTrigger({
          event: PubSubDefaultTriggers.AccountUpdate,
          suffix: recipient.accountId,
        })
        const data: NotificationsDataObject = {
          walletId: recipient.walletId,
          txNotificationType: type,
          amount: Math.abs(onchainTx.settlementAmount),
          currency: onchainTx.settlementCurrency,
          displayAmount: onchainTx.settlementDisplayAmount,
          displayCurrency: onchainTx.settlementDisplayPrice.displayCurrency,
          txHash: onchainTx.settlementVia.transactionHash,
          transaction,
        }

        // TODO: remove deprecated fields
        if (data.displayAmount) {
          const { base, offset } = onchainTx.settlementDisplayPrice
          data["displayCurrencyPerSat"] = Math.round(Number(base * 10n ** offset))
        }

        return pubsub.publish({
          trigger: accountUpdatedTrigger,
          payload: { transaction: data },
        })
      }
    } catch (err) {
      return handleCommonNotificationErrors(err)
    }
  }

  const sendTransactionPushNotification = async ({
    recipient,
    transaction,
  }: NotificatioSendTransactionArgs): Promise<true | NotificationsServiceError> => {
    try {
      const type = getPushNotificationEventType(transaction)
      if (type === undefined) return true

      const settlementAmount = new ProtoMoney()
      settlementAmount.setMinorUnits(Math.abs(transaction.settlementAmount))
      settlementAmount.setCurrencyCode(transaction.settlementCurrency)

      const displayAmountMajor = transaction.settlementDisplayAmount
      const displayCurrency = transaction.settlementDisplayPrice.displayCurrency
      const displayAmountMinor = Math.abs(
        Math.round(
          majorToMinorUnit({ amount: Number(displayAmountMajor), displayCurrency }),
        ),
      )
      const displayAmount = new ProtoMoney()
      displayAmount.setMinorUnits(displayAmountMinor)
      displayAmount.setCurrencyCode(displayCurrency)

      const tx = new TransactionOccurred()
      tx.setUserId(recipient.userId)
      tx.setType(type)
      tx.setSettlementAmount(settlementAmount)
      tx.setDisplayAmount(displayAmount)

      const event = new NotificationEvent()
      event.setTransactionOccurred(tx)

      const request = new HandleNotificationEventRequest()
      request.setEvent(event)

      await notificationsGrpc.handleNotificationEvent(
        request,
        notificationsGrpc.notificationsMetadata,
      )

      return true
    } catch (err) {
      return handleCommonNotificationErrors(err)
    }
  }

  const sendTransactionCallbackNotification = async ({
    recipient,
    transaction,
  }: NotificatioSendTransactionArgs): Promise<true | CallbackError> => {
    try {
      const eventType = getCallbackEventType(transaction)
      if (!eventType) return true

      if (recipient.level === AccountLevel.Zero) return true

      const result = await callbackService.sendMessage({
        accountId: recipient.accountId,
        walletId: recipient.walletId,
        eventType,
        payload: { transaction },
      })
      if (result instanceof Error) return result

      return true
    } catch (err) {
      return handleCommonNotificationErrors(err)
    }
  }

  const sendTransaction = async ({
    recipient,
    transaction,
  }: NotificatioSendTransactionArgs): Promise<true | NotificationsServiceError> => {
    const result = Promise.allSettled([
      sendTransactionPushNotification({ recipient, transaction }),
      // Notify the recipient and public subscribers (via GraphQL subscription if any)
      sendTransactionPubSubNotification({ recipient, transaction }),
      sendTransactionCallbackNotification({ recipient, transaction }),
    ])
    return result.then((results) => {
      for (const result of results) {
        if (result.status === "rejected") {
          return new UnknownNotificationsServiceError(result.reason)
        }
        if (result.value instanceof Error) {
          return result.value
        }
      }
      return true
    })
  }

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
    recipientUserId,
    displayBalanceAmount,
  }: SendBalanceArgs): Promise<true | NotificationsServiceError> => {
    try {
      const notificationCategory = GaloyNotificationCategories.Payments

      const settings = await getUserNotificationSettings(recipientUserId)
      if (settings instanceof Error) {
        return settings
      }
      const { pushDeviceTokens: deviceTokens } = settings
      const hasDeviceTokens = deviceTokens && deviceTokens.length > 0
      if (!hasDeviceTokens) return true
      const { title, body } = createPushNotificationContent({
        type: "balance",
        userLanguage: settings.language,
        amount: balanceAmount,
        displayAmount: displayBalanceAmount,
      })

      const result = await pushNotification.sendFilteredNotification({
        deviceTokens,
        title,
        body,
        notificationCategory,
        userId: recipientUserId,
      })

      if (result instanceof NotificationsServiceError) {
        return result
      }

      return true
    } catch (err) {
      return handleCommonNotificationErrors(err)
    }
  }

  const addPushDeviceToken = async ({
    userId,
    deviceToken,
  }: {
    userId: UserId
    deviceToken: DeviceToken
  }): Promise<NotificationSettings | NotificationsServiceError> => {
    try {
      const request = new AddPushDeviceTokenRequest()
      request.setUserId(userId)
      request.setDeviceToken(deviceToken)

      const response = await notificationsGrpc.addPushDeviceToken(
        request,
        notificationsGrpc.notificationsMetadata,
      )

      const notificationSettings = grpcNotificationSettingsToNotificationSettings(
        response.getNotificationSettings(),
      )

      return notificationSettings
    } catch (err) {
      return handleCommonNotificationErrors(err)
    }
  }

  const removePushDeviceToken = async ({
    userId,
    deviceToken,
  }: {
    userId: UserId
    deviceToken: DeviceToken
  }): Promise<NotificationSettings | NotificationsServiceError> => {
    try {
      const request = new RemovePushDeviceTokenRequest()
      request.setUserId(userId)
      request.setDeviceToken(deviceToken)

      const response = await notificationsGrpc.removePushDeviceToken(
        request,
        notificationsGrpc.notificationsMetadata,
      )

      const notificationSettings = grpcNotificationSettingsToNotificationSettings(
        response.getNotificationSettings(),
      )

      return notificationSettings
    } catch (err) {
      return handleCommonNotificationErrors(err)
    }
  }

  const updateEmailAddress = async ({
    userId,
    email,
  }: {
    userId: UserId
    email: EmailAddress
  }): Promise<true | NotificationsServiceError> => {
    try {
      const request = new UpdateEmailAddressRequest()
      request.setUserId(userId)
      request.setEmailAddress(email)

      await notificationsGrpc.updateEmailAddress(
        request,
        notificationsGrpc.notificationsMetadata,
      )

      return true
    } catch (err) {
      return handleCommonNotificationErrors(err)
    }
  }

  const removeEmailAddress = async ({
    userId,
  }: {
    userId: UserId
  }): Promise<true | NotificationsServiceError> => {
    try {
      const request = new RemoveEmailAddressRequest()
      request.setUserId(userId)

      await notificationsGrpc.removeEmailAddress(
        request,
        notificationsGrpc.notificationsMetadata,
      )

      return true
    } catch (err) {
      return handleCommonNotificationErrors(err)
    }
  }

  const updateUserLanguage = async ({
    userId,
    language,
  }: {
    userId: UserId
    language: UserLanguage
  }): Promise<NotificationSettings | NotificationsServiceError> => {
    try {
      const request = new UpdateUserLocaleRequest()
      request.setUserId(userId)
      request.setLocale(language)
      const response = await notificationsGrpc.updateUserLocale(
        request,
        notificationsGrpc.notificationsMetadata,
      )

      const notificationSettings = grpcNotificationSettingsToNotificationSettings(
        response.getNotificationSettings(),
      )

      return notificationSettings
    } catch (err) {
      return handleCommonNotificationErrors(err)
    }
  }

  const enableNotificationChannel = async ({
    userId,
    notificationChannel,
  }: {
    userId: UserId
    notificationChannel: NotificationChannel
  }): Promise<NotificationSettings | NotificationsServiceError> => {
    try {
      const request = new EnableNotificationChannelRequest()
      request.setUserId(userId)

      const grpcNotificationChannel =
        notificationChannelToGrpcNotificationChannel(notificationChannel)

      request.setChannel(grpcNotificationChannel)
      const response = await notificationsGrpc.enableNotificationChannel(
        request,
        notificationsGrpc.notificationsMetadata,
      )

      const notificationSettings = grpcNotificationSettingsToNotificationSettings(
        response.getNotificationSettings(),
      )

      return notificationSettings
    } catch (err) {
      return handleCommonNotificationErrors(err)
    }
  }

  const disableNotificationChannel = async ({
    userId,
    notificationChannel,
  }: {
    userId: UserId
    notificationChannel: NotificationChannel
  }): Promise<NotificationSettings | NotificationsServiceError> => {
    try {
      const request = new DisableNotificationChannelRequest()
      request.setUserId(userId)

      const grpcNotificationChannel =
        notificationChannelToGrpcNotificationChannel(notificationChannel)

      request.setChannel(grpcNotificationChannel)
      const response = await notificationsGrpc.disableNotificationChannel(
        request,
        notificationsGrpc.notificationsMetadata,
      )

      const notificationSettings = grpcNotificationSettingsToNotificationSettings(
        response.getNotificationSettings(),
      )

      return notificationSettings
    } catch (err) {
      return handleCommonNotificationErrors(err)
    }
  }

  const enableNotificationCategory = async ({
    userId,
    notificationChannel,
    notificationCategory,
  }: {
    userId: UserId
    notificationChannel: NotificationChannel
    notificationCategory: NotificationCategory
  }): Promise<NotificationSettings | NotificationsServiceError> => {
    try {
      const request = new EnableNotificationCategoryRequest()
      request.setUserId(userId)

      const grpcNotificationChannel =
        notificationChannelToGrpcNotificationChannel(notificationChannel)
      request.setChannel(grpcNotificationChannel)

      const grpcNotificationCategory =
        notificationCategoryToGrpcNotificationCategory(notificationCategory)
      request.setCategory(grpcNotificationCategory)

      const response = await notificationsGrpc.enableNotificationCatgeory(
        request,
        notificationsGrpc.notificationsMetadata,
      )

      const notificationSettings = grpcNotificationSettingsToNotificationSettings(
        response.getNotificationSettings(),
      )

      return notificationSettings
    } catch (err) {
      return handleCommonNotificationErrors(err)
    }
  }

  const disableNotificationCategory = async ({
    userId,
    notificationChannel,
    notificationCategory,
  }: {
    userId: UserId
    notificationChannel: NotificationChannel
    notificationCategory: NotificationCategory
  }): Promise<NotificationSettings | NotificationsServiceError> => {
    try {
      const request = new DisableNotificationCategoryRequest()
      request.setUserId(userId)

      const grpcNotificationChannel =
        notificationChannelToGrpcNotificationChannel(notificationChannel)
      request.setChannel(grpcNotificationChannel)

      const grpcNotificationCategory =
        notificationCategoryToGrpcNotificationCategory(notificationCategory)
      request.setCategory(grpcNotificationCategory)

      const response = await notificationsGrpc.disableNotificationCategory(
        request,
        notificationsGrpc.notificationsMetadata,
      )

      const notificationSettings = grpcNotificationSettingsToNotificationSettings(
        response.getNotificationSettings(),
      )

      return notificationSettings
    } catch (err) {
      return handleCommonNotificationErrors(err)
    }
  }

  const triggerMarketingNotification = async ({
    userIds,
    localizedPushContent,
  }: {
    userIds: UserId[]
    localizedPushContent: {
      title: string
      body: string
      language: UserLanguage
    }[]
  }): Promise<true | NotificationsServiceError> => {
    try {
      const marketing_notification = new MarketingNotificationTriggered()
      marketing_notification.setUserIdsList(userIds)

      localizedPushContent.forEach((content) => {
        const { title, body, language } = content
        const localizedContent = new LocalizedPushContent()
        localizedContent.setTitle(title)
        localizedContent.setBody(body)
        marketing_notification
          .getLocalizedPushContentMap()
          .set(language, localizedContent)
      })

      const event = new NotificationEvent()
      event.setMarketingNotificationTriggered(marketing_notification)

      const request = new HandleNotificationEventRequest()
      request.setEvent(event)

      await notificationsGrpc.handleNotificationEvent(
        request,
        notificationsGrpc.notificationsMetadata,
      )

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
        sendTransaction,
        sendBalance,
        getUserNotificationSettings,
        updateUserLanguage,
        enableNotificationChannel,
        disableNotificationChannel,
        enableNotificationCategory,
        disableNotificationCategory,
        addPushDeviceToken,
        updateEmailAddress,
        removeEmailAddress,
        removePushDeviceToken,
        triggerMarketingNotification,
      },
    }),
  }
}

const getPubSubNotificationEventType = (
  transaction: WalletTransaction,
): NotificationType | undefined => {
  const type = translateToNotificationType(transaction)
  switch (type) {
    case NotificationType.LigtningReceipt:
    case NotificationType.IntraLedgerReceipt:
    case NotificationType.OnchainReceiptPending:
    case NotificationType.OnchainPayment:
      return type

    // special case because we don't have a hash
    case NotificationType.OnchainReceipt: {
      const settlementViaType = transaction.settlementVia.type
      return settlementViaType === "intraledger"
        ? NotificationType.IntraLedgerReceipt
        : type
    }
    default:
      return undefined
  }
}

const getPushNotificationEventType = (
  transaction: WalletTransaction,
): number | undefined => {
  const type = translateToNotificationType(transaction)
  switch (type) {
    case NotificationType.LigtningReceipt:
      return ProtoTransactionType.LIGHTNING_RECEIPT
    case NotificationType.IntraLedgerReceipt:
      return ProtoTransactionType.INTRA_LEDGER_RECEIPT
    case NotificationType.OnchainReceiptPending:
      return ProtoTransactionType.ONCHAIN_RECEIPT_PENDING
    case NotificationType.OnchainPayment:
      return ProtoTransactionType.ONCHAIN_PAYMENT

    // special case because we don't have a hash
    case NotificationType.OnchainReceipt: {
      const settlementViaType = transaction.settlementVia.type
      return settlementViaType === "intraledger"
        ? ProtoTransactionType.INTRA_LEDGER_RECEIPT
        : ProtoTransactionType.ONCHAIN_RECEIPT
    }
    default:
      return undefined
  }
}

const getCallbackEventType = (
  transaction: WalletTransaction,
): CallbackEventType | undefined => {
  const type = translateToNotificationType(transaction)
  switch (type) {
    case NotificationType.LigtningReceipt:
      return CallbackEventType.ReceiveLightning

    case NotificationType.LigtningPayment:
      return CallbackEventType.SendLightning

    case NotificationType.IntraLedgerReceipt:
      return CallbackEventType.ReceiveIntraledger

    case NotificationType.IntraLedgerPayment:
      return CallbackEventType.SendIntraledger

    case NotificationType.OnchainReceiptPending:
    case NotificationType.OnchainReceipt:
      return CallbackEventType.ReceiveOnchain

    case NotificationType.OnchainPayment:
      return CallbackEventType.SendOnchain

    default:
      return undefined
  }
}

const translateToNotificationType = (
  transaction: WalletTransaction,
): NotificationType | undefined => {
  const type = transaction.initiationVia.type
  const isReceive = transaction.settlementAmount > 0
  if (type === "lightning") {
    return isReceive ? NotificationType.LigtningReceipt : NotificationType.LigtningPayment
  }

  if (type === "intraledger") {
    return isReceive
      ? NotificationType.IntraLedgerReceipt
      : NotificationType.IntraLedgerPayment
  }

  if (type === "onchain") {
    if (isReceive) {
      return transaction.status === TxStatus.Pending
        ? NotificationType.OnchainReceiptPending
        : NotificationType.OnchainReceipt
    }
    return NotificationType.OnchainPayment
  }
}
