import {
  handleCommonNotificationErrors,
  PushNotificationsService,
} from "./push-notifications"

import { createPushNotificationContent } from "./create-push-notification-content"

import { toSats } from "@/domain/bitcoin"
import { WalletCurrency } from "@/domain/shared"
import { majorToMinorUnit, toCents, UsdDisplayCurrency } from "@/domain/fiat"
import { customPubSubTrigger, PubSubDefaultTriggers } from "@/domain/pubsub"
import {
  GaloyNotificationCategories,
  NotificationsServiceError,
  NotificationType,
  UnknownNotificationsServiceError,
} from "@/domain/notifications"

import { PubSubService } from "@/services/pubsub"
import { wrapAsyncFunctionsToRunInSpan } from "@/services/tracing"
import { WalletInvoiceStatus } from "@/domain/wallet-invoices"
import { TxStatus } from "@/domain/wallets/tx-status"

export const NotificationsService = (): INotificationsService => {
  const pubsub = PubSubService()
  const pushNotification = PushNotificationsService()

  const sendTransactionPubSubNotification = async ({
    recipient,
    transaction,
  }: NotificatioSendTransactionArgs): Promise<void | PubSubServiceError> => {
    try {
      const type = translateToNotificationType(transaction)
      if (!type) return

      if (type === NotificationType.LnInvoicePaid) {
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
            payload: { status: WalletInvoiceStatus.Paid },
          }),
          pubsub.publish({
            trigger: accountUpdatedTrigger,
            payload: {
              invoice: {
                walletId: recipient.walletId,
                paymentHash,
                status: WalletInvoiceStatus.Paid,
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
          amount: BigInt(intraLedgerTx.settlementAmount),
          currency: intraLedgerTx.settlementCurrency,
          displayAmount: intraLedgerTx.settlementDisplayAmount,
          displayCurrency: intraLedgerTx.settlementDisplayPrice.displayCurrency,
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
          amount: BigInt(Math.abs(onchainTx.settlementAmount)),
          currency: onchainTx.settlementCurrency,
          displayAmount: onchainTx.settlementDisplayAmount,
          displayCurrency: onchainTx.settlementDisplayPrice.displayCurrency,
          txHash: onchainTx.settlementVia.transactionHash,
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
  }: NotificatioSendTransactionArgs): Promise<true | PubSubServiceError> => {
    try {
      const hasDeviceTokens = recipient.deviceTokens && recipient.deviceTokens.length > 0
      if (!hasDeviceTokens) return true

      const type = translateToNotificationType(transaction)
      if (!type) return true

      const displayAmountMajor = transaction.settlementDisplayAmount
      const displayCurrency = transaction.settlementDisplayPrice.displayCurrency
      const displayAmountMinor = BigInt(
        majorToMinorUnit({ amount: Number(displayAmountMajor), displayCurrency }),
      )
      const { title, body } = createPushNotificationContent({
        type,
        userLanguage: recipient.language,
        amount: {
          amount: BigInt(Math.abs(transaction.settlementAmount)),
          currency: transaction.settlementCurrency,
        },
        displayAmount: {
          amountInMinor: displayAmountMinor,
          displayInMajor: displayAmountMajor,
          currency: displayCurrency,
        },
      })

      const result = await pushNotification.sendFilteredNotification({
        deviceTokens: recipient.deviceTokens,
        title,
        body,
        notificationCategory: GaloyNotificationCategories.Payments,
        notificationSettings: recipient.notificationSettings,
      })

      if (result instanceof NotificationsServiceError) return result

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
        sendTransaction,
        sendBalance,
        adminPushNotificationSend,
        adminPushNotificationFilteredSend,
      },
    }),
  }
}

const translateToNotificationType = (
  transaction: WalletTransaction,
): NotificationType | undefined => {
  const type = transaction.settlementVia.type
  const isReceive = transaction.settlementAmount > 0
  if (type === "lightning") {
    return isReceive ? NotificationType.LnInvoicePaid : undefined
  }

  if (type === "intraledger") {
    return isReceive ? NotificationType.IntraLedgerReceipt : undefined
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
