import { getDisplayCurrencyConfig } from "@config"
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
import { createPushNotificationContent } from "./create-push-notification-content"

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

      const paymentAmount = { amount: BigInt(sats), currency: WalletCurrency.Btc }
      const displayPaymentAmount = displayCurrencyPerSat
        ? {
            amount: sats * (displayCurrencyPerSat || 0),
            currency: DefaultDisplayCurrency,
          }
        : undefined

      const { title, body } = createPushNotificationContent({
        type,
        userLanguage: user.language,
        paymentAmount,
        displayPaymentAmount,
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

      const paymentAmount = { amount: BigInt(sats), currency: WalletCurrency.Btc }
      const displayPaymentAmount = displayCurrencyPerSat
        ? {
            amount: Number(paymentAmount.amount) * (displayCurrencyPerSat || 0),
            currency: DefaultDisplayCurrency,
          }
        : undefined

      const { title, body } = createPushNotificationContent({
        type: NotificationType.LnInvoicePaid,
        userLanguage: user.language,
        paymentAmount,
        displayPaymentAmount,
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

      const paymentAmount = { amount: BigInt(cents), currency: WalletCurrency.Usd }

      const { title, body } = createPushNotificationContent({
        type: NotificationType.LnInvoicePaid,
        userLanguage: user.language,
        paymentAmount,
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

        const paymentAmount = {
          amount: BigInt(amount),
          currency: WalletCurrency.Btc,
        }

        const displayPaymentAmount = displayCurrencyPerSat
          ? {
              amount: amount * (displayCurrencyPerSat || 0),
              currency: DefaultDisplayCurrency,
            }
          : undefined

        const { title, body } = createPushNotificationContent({
          type,
          userLanguage: user.language,
          paymentAmount,
          displayPaymentAmount,
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

        const paymentAmount = { amount: BigInt(sats), currency: WalletCurrency.Btc }
        const displayPaymentAmount = displayCurrencyPerSat
          ? {
              amount: Number(paymentAmount.amount) * (displayCurrencyPerSat || 0),
              currency: DefaultDisplayCurrency,
            }
          : undefined

        const { title, body } = createPushNotificationContent({
          type,
          userLanguage: user.language,
          paymentAmount,
          displayPaymentAmount,
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

        const paymentAmount = { amount: BigInt(cents), currency: WalletCurrency.Usd }

        const { title, body } = createPushNotificationContent({
          type,
          userLanguage: user.language,
          paymentAmount,
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
