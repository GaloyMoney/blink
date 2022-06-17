import { getDisplayCurrencyConfig } from "@config"
import { toSats } from "@domain/bitcoin"
import { NotImplementedError } from "@domain/errors"
import { toCents } from "@domain/fiat"
import {
  NotificationsServiceError,
  NotificationType,
  UnknownNotificationsServiceError,
} from "@domain/notifications"
import { customPubSubTrigger, PubSubDefaultTriggers } from "@domain/pubsub"
import { WalletCurrency } from "@domain/shared"
import { UsersRepository } from "@services/mongoose"
import { PubSubService } from "@services/pubsub"
import { wrapAsyncFunctionsToRunInSpan } from "@services/tracing"

import { PushNotificationsService } from "./push-notifications"
import { createPushNotificationContent } from "./create-push-notification-content"

const { code: DefaultDisplayCurrency } = getDisplayCurrencyConfig()

export const NotificationsService = (logger: Logger): INotificationsService => {
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
          paymentAmount,
          displayPaymentAmount,
        })

        // Do not await this call for quicker processing
        pushNotification.sendNotification({
          deviceToken: recipientDeviceTokens,
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
      const data = {
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
          paymentAmount,
          displayPaymentAmount,
        })

        // Do not await this call for quicker processing
        pushNotification.sendNotification({
          deviceToken: recipientDeviceTokens,
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
    deviceTokens?: DeviceToken[]
    language?: UserLanguage
    txHash: OnChainTxHash
  }): Promise<void | NotificationsServiceError> => {
    try {
      // Notify the recipient (via GraphQL subscription if any)
      const accountUpdatedTrigger = customPubSubTrigger({
        event: PubSubDefaultTriggers.AccountUpdate,
        suffix: accountId,
      })
      const data = {
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

      if (deviceTokens && deviceTokens.length > 0) {
        const { title, body } = createPushNotificationContent({
          type,
          userLanguage: language,
          paymentAmount,
          displayPaymentAmount,
        })

        // Do not await this call for quicker processing
        pushNotification.sendNotification({
          deviceToken: deviceTokens,
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
    balance,
    walletCurrency,
    userId,
    displayCurrencyPerSat,
  }: SendBalanceArgs): Promise<void | NotImplementedError> => {
    const user = await UsersRepository().findById(userId)
    if (user instanceof Error) {
      logger.warn({ user }, "impossible to fetch user to send transaction")
      return
    }

    const paymentAmount = { amount: BigInt(balance), currency: walletCurrency }
    const displayPaymentAmount = displayCurrencyPerSat
      ? {
          amount: balance * (displayCurrencyPerSat || 0),
          currency: DefaultDisplayCurrency,
        }
      : undefined

    const { title, body } = createPushNotificationContent({
      type: "balance",
      userLanguage: user.language,
      paymentAmount,
      displayPaymentAmount,
    })

    logger.info(
      { userId, locale: user.language, balance, title, body },
      `sending balance notification to user`,
    )

    // Do not await this call for quicker processing
    pushNotification.sendNotification({
      deviceToken: user.deviceTokens,
      title,
      body,
    })
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
