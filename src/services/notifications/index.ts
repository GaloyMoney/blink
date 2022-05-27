import { getLocale, getDisplayCurrencyConfig, getI18nInstance } from "@config"
import { toSats } from "@domain/bitcoin"
import { NotImplementedError } from "@domain/errors"
import { toCents } from "@domain/fiat"
import { NotificationsServiceError, NotificationType } from "@domain/notifications"
import { customPubSubTrigger, PubSubDefaultTriggers } from "@domain/pubsub"
import { WalletCurrency } from "@domain/shared"
import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@services/mongoose"
import { PubSubService } from "@services/pubsub"
import { wrapAsyncFunctionsToRunInSpan } from "@services/tracing"

import { PushNotificationsService } from "./push-notifications"

const i18n = getI18nInstance()
const defaultLocale = getLocale()
const { code: DefaultDisplayCurrency } = getDisplayCurrencyConfig()

export const NotificationsService = (logger: Logger): INotificationsService => {
  const pubsub = PubSubService()
  const pushNotification = PushNotificationsService()

  const sendOnChainNotification = async ({
    type,
    sats,
    walletId,
    txHash,
    displayCurrencyPerSat,
  }: {
    type: NotificationType
    walletId: WalletId
    sats: Satoshis
    txHash: OnChainTxHash
    displayCurrencyPerSat?: DisplayCurrencyPerSat
  }): Promise<void | NotificationsServiceError> => {
    // FIXME: this try/catch is probably a no-op
    // because the error would not be awaited if they arise
    // see if this is safe to delete
    try {
      const wallet = await WalletsRepository().findById(walletId)
      if (wallet instanceof Error) throw wallet

      const account = await AccountsRepository().findById(wallet.accountId)
      if (account instanceof Error) return account

      const user = await UsersRepository().findById(account.ownerId)
      if (user instanceof Error) return user

      const { title, body } = getPushNotificationContent({
        type,
        userLanguage: user.language,
        baseCurrency: WalletCurrency.Btc,
        amountBaseCurrency: sats,
        displayCurrency: displayCurrencyPerSat ? DefaultDisplayCurrency : undefined,
        amountDisplayCurrency: (sats *
          (displayCurrencyPerSat || 0)) as DisplayCurrencyBaseAmount,
      })

      // Do not await this call for quicker processing
      pushNotification.sendNotification({
        deviceToken: user.deviceTokens,
        title,
        body,
      })

      // Notify the recipient (via GraphQL subscription if any)
      const accountUpdatedTrigger = customPubSubTrigger({
        event: PubSubDefaultTriggers.AccountUpdate,
        suffix: account.id,
      })
      pubsub.publish({
        trigger: accountUpdatedTrigger,
        payload: {
          transaction: {
            walletId,
            txNotificationType: type,
            amount: sats,
            txHash,
            displayCurrencyPerSat,
          },
        },
      })
    } catch (err) {
      return new NotificationsServiceError(err)
    }
  }

  const onChainTransactionReceived = async ({
    amount,
    walletId,
    txHash,
    displayCurrencyPerSat,
  }: OnChainTxReceivedArgs) =>
    sendOnChainNotification({
      type: NotificationType.OnchainReceipt,
      sats: amount,
      walletId,
      txHash,
      displayCurrencyPerSat,
    })

  const onChainTransactionReceivedPending = async ({
    amount,
    walletId,
    txHash,
    displayCurrencyPerSat,
  }: OnChainTxReceivedPendingArgs) =>
    sendOnChainNotification({
      type: NotificationType.OnchainReceiptPending,
      sats: amount,
      walletId,
      txHash,
      displayCurrencyPerSat,
    })

  const onChainTransactionPayment = async ({
    amount,
    walletId,
    txHash,
    displayCurrencyPerSat,
  }: OnChainTxPaymentArgs) =>
    sendOnChainNotification({
      type: NotificationType.OnchainPayment,
      sats: amount,
      walletId,
      txHash,
      displayCurrencyPerSat,
    })

  const lnInvoiceBitcoinWalletPaid = async ({
    paymentHash,
    recipientWalletId,
    sats,
    displayCurrencyPerSat,
  }: LnInvoicePaidBitcoinWalletArgs) => {
    try {
      const wallet = await WalletsRepository().findById(recipientWalletId)
      if (wallet instanceof Error) throw wallet

      const account = await AccountsRepository().findById(wallet.accountId)
      if (account instanceof Error) return account

      const user = await UsersRepository().findById(account.ownerId)
      if (user instanceof Error) return user

      const amountBaseCurrency = toSats(Number(sats))

      const { title, body } = getPushNotificationContent({
        type: NotificationType.LnInvoicePaid,
        userLanguage: user.language,
        baseCurrency: WalletCurrency.Btc,
        amountBaseCurrency,
        displayCurrency: displayCurrencyPerSat ? DefaultDisplayCurrency : undefined,
        amountDisplayCurrency: (amountBaseCurrency *
          (displayCurrencyPerSat || 0)) as DisplayCurrencyBaseAmount,
      })

      // Do not await this call for quicker processing
      pushNotification.sendNotification({
        deviceToken: user.deviceTokens,
        title,
        body,
      })

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
        suffix: account.id,
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
    } catch (err) {
      return new NotificationsServiceError(err)
    }
  }

  const lnInvoiceUsdWalletPaid = async ({
    paymentHash,
    recipientWalletId,
    cents,
  }: LnInvoicePaidUsdWalletArgs) => {
    try {
      const wallet = await WalletsRepository().findById(recipientWalletId)
      if (wallet instanceof Error) throw wallet

      const account = await AccountsRepository().findById(wallet.accountId)
      if (account instanceof Error) return account

      const user = await UsersRepository().findById(account.ownerId)
      if (user instanceof Error) return user

      const { title, body } = getPushNotificationContent({
        type: NotificationType.LnInvoicePaid,
        userLanguage: user.language,
        baseCurrency: WalletCurrency.Usd,
        amountBaseCurrency: toCents(Number(cents)),
      })

      // Do not await this call for quicker processing
      pushNotification.sendNotification({
        deviceToken: user.deviceTokens,
        title,
        body,
      })

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
        suffix: account.id,
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
    } catch (err) {
      return new NotificationsServiceError(err)
    }
  }

  const priceUpdate = (displayCurrencyPerSat) => {
    const payload = { satUsdCentPrice: 100 * displayCurrencyPerSat }
    pubsub.publish({ trigger: PubSubDefaultTriggers.PriceUpdate, payload })
    pubsub.publish({
      trigger: PubSubDefaultTriggers.UserPriceUpdate,
      payload: {
        price: payload,
      },
    })
  }

  const intraLedgerPaid = async ({
    senderWalletId,
    recipientWalletId,
    amount,
    displayCurrencyPerSat,
  }: IntraLedgerArgs): Promise<void | NotificationsServiceError> => {
    try {
      const publish = async ({
        walletId,
        type,
      }: {
        walletId: WalletId
        type: NotificationType
      }) => {
        const wallet = await WalletsRepository().findById(walletId)
        if (wallet instanceof Error) return wallet

        const account = await AccountsRepository().findById(wallet.accountId)
        if (account instanceof Error) return account

        // Notify the recipient (via GraphQL subscription if any)
        const accountUpdatedTrigger = customPubSubTrigger({
          event: PubSubDefaultTriggers.AccountUpdate,
          suffix: account.id,
        })
        pubsub.publish({
          trigger: accountUpdatedTrigger,
          payload: {
            intraLedger: {
              walletId,
              txNotificationType: type,
              amount,
              displayCurrencyPerSat,
            },
          },
        })

        const user = await UsersRepository().findById(account.ownerId)
        if (user instanceof Error) return user

        const { title, body } = getPushNotificationContent({
          type,
          userLanguage: user.language,
          baseCurrency: WalletCurrency.Btc,
          amountBaseCurrency: amount,
          displayCurrency: displayCurrencyPerSat ? DefaultDisplayCurrency : undefined,
          amountDisplayCurrency: (amount *
            (displayCurrencyPerSat || 0)) as DisplayCurrencyBaseAmount,
        })

        // Do not await this call for quicker processing
        pushNotification.sendNotification({
          deviceToken: user.deviceTokens,
          title,
          body,
        })
      }

      publish({
        walletId: senderWalletId,
        type: NotificationType.IntraLedgerPayment,
      })

      publish({
        walletId: recipientWalletId,
        type: NotificationType.IntraLedgerReceipt,
      })
    } catch (err) {
      return new NotificationsServiceError(err)
    }
  }

  const intraLedgerBtcWalletPaid = async ({
    senderWalletId,
    recipientWalletId,
    sats,
    displayCurrencyPerSat,
  }: IntraLedgerPaidBitcoinWalletArgs): Promise<void | NotificationsServiceError> => {
    try {
      const publish = async ({
        walletId,
        type,
      }: {
        walletId: WalletId
        type: NotificationType
      }) => {
        const wallet = await WalletsRepository().findById(walletId)
        if (wallet instanceof Error) return wallet

        const account = await AccountsRepository().findById(wallet.accountId)
        if (account instanceof Error) return account

        // Notify the recipient (via GraphQL subscription if any)
        const accountUpdatedTrigger = customPubSubTrigger({
          event: PubSubDefaultTriggers.AccountUpdate,
          suffix: account.id,
        })
        pubsub.publish({
          trigger: accountUpdatedTrigger,
          payload: {
            intraLedger: {
              walletId,
              txNotificationType: type,
              sats: toSats(Number(sats)),
              displayCurrencyPerSat,
            },
          },
        })

        const user = await UsersRepository().findById(account.ownerId)
        if (user instanceof Error) return user

        const amount = toSats(Number(sats))

        const { title, body } = getPushNotificationContent({
          type,
          userLanguage: user.language,
          baseCurrency: WalletCurrency.Btc,
          amountBaseCurrency: amount,
          displayCurrency: displayCurrencyPerSat ? DefaultDisplayCurrency : undefined,
          amountDisplayCurrency: (amount *
            (displayCurrencyPerSat || 0)) as DisplayCurrencyBaseAmount,
        })

        // Do not await this call for quicker processing
        pushNotification.sendNotification({
          deviceToken: user.deviceTokens,
          title,
          body,
        })
      }

      publish({
        walletId: senderWalletId,
        type: NotificationType.IntraLedgerPayment,
      })

      publish({
        walletId: recipientWalletId,
        type: NotificationType.IntraLedgerReceipt,
      })
    } catch (err) {
      return new NotificationsServiceError(err)
    }
  }

  const intraLedgerUsdWalletPaid = async ({
    senderWalletId,
    recipientWalletId,
    cents,
    displayCurrencyPerSat,
  }: IntraLedgerPaidUsdWalletArgs): Promise<void | NotificationsServiceError> => {
    try {
      const publish = async ({
        walletId,
        type,
      }: {
        walletId: WalletId
        type: NotificationType
      }) => {
        const wallet = await WalletsRepository().findById(walletId)
        if (wallet instanceof Error) return wallet

        const account = await AccountsRepository().findById(wallet.accountId)
        if (account instanceof Error) return account

        // Notify the recipient (via GraphQL subscription if any)
        const accountUpdatedTrigger = customPubSubTrigger({
          event: PubSubDefaultTriggers.AccountUpdate,
          suffix: account.id,
        })
        pubsub.publish({
          trigger: accountUpdatedTrigger,
          payload: {
            intraLedger: {
              walletId,
              txNotificationType: type,
              cents: toCents(Number(cents)),
              displayCurrencyPerSat,
            },
          },
        })

        const user = await UsersRepository().findById(account.ownerId)
        if (user instanceof Error) return user

        const { title, body } = getPushNotificationContent({
          type,
          userLanguage: user.language,
          baseCurrency: WalletCurrency.Usd,
          amountBaseCurrency: toCents(Number(cents)),
        })

        // Do not await this call for quicker processing
        pushNotification.sendNotification({
          deviceToken: user.deviceTokens,
          title,
          body,
        })
      }

      publish({
        walletId: senderWalletId,
        type: NotificationType.IntraLedgerPayment,
      })

      publish({
        walletId: recipientWalletId,
        type: NotificationType.IntraLedgerReceipt,
      })
    } catch (err) {
      return new NotificationsServiceError(err)
    }
  }

  const sendBalance = async ({
    balance,
    walletCurrency,
    userId,
    price,
  }: {
    balance: CurrencyBaseAmount
    walletCurrency: WalletCurrency
    userId: UserId
    price: DisplayCurrencyPerSat | Error
  }): Promise<void | NotImplementedError> => {
    const user = await UsersRepository().findById(userId)
    if (user instanceof Error) {
      logger.warn({ user }, "impossible to fetch user to send transaction")
      return
    }

    const displayCurrencyPerSat = price instanceof Error ? undefined : price

    const { title, body } = getPushNotificationContent({
      type: "balance",
      userLanguage: user.language,
      baseCurrency: walletCurrency,
      amountBaseCurrency: balance,
      displayCurrency: displayCurrencyPerSat ? DefaultDisplayCurrency : undefined,
      amountDisplayCurrency: (balance *
        (displayCurrencyPerSat || 0)) as DisplayCurrencyBaseAmount,
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
      namespace: "services.lnd.offchain",
      fns: {
        onChainTransactionReceived,
        onChainTransactionReceivedPending,
        onChainTransactionPayment,
        lnInvoiceBitcoinWalletPaid,
        lnInvoiceUsdWalletPaid,
        intraLedgerPaid,
        intraLedgerBtcWalletPaid,
        intraLedgerUsdWalletPaid,
        sendBalance,
      },
    }),
  }
}

export const getPushNotificationContent = ({
  type,
  amountBaseCurrency,
  baseCurrency,
  amountDisplayCurrency,
  displayCurrency,
  userLanguage,
}: {
  type: NotificationType | "balance"
  amountBaseCurrency: Satoshis | UsdCents
  baseCurrency: WalletCurrency
  amountDisplayCurrency?: DisplayCurrencyBaseAmount
  displayCurrency?: DisplayCurrency
  userLanguage?: UserLanguage
}): {
  title: string
  body: string
} => {
  const locale = userLanguage || defaultLocale
  const notificationType = type === "balance" ? type : `transaction.${type}`
  const title = i18n.__({ phrase: `notification.${notificationType}.title`, locale })
  const baseCurrencyName = baseCurrency === WalletCurrency.Btc ? "sats" : ""
  const baseCurrencySymbol = baseCurrency === WalletCurrency.Usd ? "$" : ""
  const amount =
    baseCurrency === WalletCurrency.Usd ? amountBaseCurrency / 100 : amountBaseCurrency
  const baseCurrencyAmount = amount.toLocaleString(locale, {
    maximumFractionDigits: 2,
  })

  let body = i18n.__(
    { phrase: `notification.${notificationType}.body`, locale },
    { baseCurrencySymbol, baseCurrencyAmount, baseCurrencyName },
  )

  if (displayCurrency && amountDisplayCurrency && displayCurrency !== baseCurrency) {
    const displayCurrencyName = i18n.__({
      phrase: `currency.${displayCurrency}.name`,
      locale,
    })
    const displayCurrencySymbol = i18n.__({
      phrase: `currency.${displayCurrency}.symbol`,
      locale,
    })
    const displayCurrencyAmount = amountDisplayCurrency.toLocaleString(locale, {
      maximumFractionDigits: 2,
    })
    body = i18n.__(
      { phrase: `notification.${notificationType}.bodyDisplayCurrency`, locale },
      {
        displayCurrencySymbol,
        displayCurrencyAmount,
        displayCurrencyName,
        baseCurrencySymbol,
        baseCurrencyAmount,
        baseCurrencyName,
      },
    )
  }

  return { title, body }
}
