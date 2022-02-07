import { SAT_USDCENT_PRICE, USER_PRICE_UPDATE_EVENT } from "@config"
import { lnPaymentStatusEvent } from "@domain/bitcoin/lightning"
import {
  accountUpdateEvent,
  NotificationsServiceError,
  NotificationType,
} from "@domain/notifications"
import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@services/mongoose"
import pubsub from "@services/pubsub"

import { sendNotification } from "./notification"
import { transactionNotification } from "./payment"

export const NotificationsService = (logger: Logger): INotificationsService => {
  const sendOnChainNotification = async ({
    type,
    amount,
    walletId,
    txHash,
    displayCurrencyPerSat,
  }: {
    type: NotificationType
    walletId: WalletId
    amount: Satoshis
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

      // Do not await this call for quicker processing
      transactionNotification({
        type,
        user,
        logger,
        amount,
        txHash,
        displayCurrencyPerSat,
      })

      // Notify the recipient (via GraphQL subscription if any)
      const accountUpdatedEventName = accountUpdateEvent(account.id)

      pubsub.publish(accountUpdatedEventName, {
        transaction: {
          walletId,
          txNotificationType: type,
          amount,
          txHash,
          displayCurrencyPerSat,
        },
      })
      return
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
      amount,
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
      amount,
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
      amount,
      walletId,
      txHash,
      displayCurrencyPerSat,
    })

  const lnInvoicePaid = async ({
    paymentHash,
    recipientWalletId,
    amount,
    displayCurrencyPerSat,
  }: LnInvoicePaidArgs) => {
    try {
      const wallet = await WalletsRepository().findById(recipientWalletId)
      if (wallet instanceof Error) throw wallet

      const account = await AccountsRepository().findById(wallet.accountId)
      if (account instanceof Error) return account

      const user = await UsersRepository().findById(account.ownerId)
      if (user instanceof Error) return user

      // Do not await this call for quicker processing
      transactionNotification({
        type: NotificationType.LnInvoicePaid,
        user,
        logger,
        amount,
        paymentHash,
        displayCurrencyPerSat,
      })

      // Notify public subscribers (via GraphQL subscription if any)
      const eventName = lnPaymentStatusEvent(paymentHash)
      pubsub.publish(eventName, { status: "PAID" })

      // Notify the recipient (via GraphQL subscription if any)
      const accountUpdatedEventName = accountUpdateEvent(account.id)
      pubsub.publish(accountUpdatedEventName, {
        invoice: {
          walletId: recipientWalletId,
          paymentHash,
          status: "PAID",
        },
      })
      return
    } catch (err) {
      return new NotificationsServiceError(err)
    }
  }

  const priceUpdate = (displayCurrencyPerSat) => {
    pubsub.publish(SAT_USDCENT_PRICE, { satUsdCentPrice: 100 * displayCurrencyPerSat })
    pubsub.publish(USER_PRICE_UPDATE_EVENT, {
      price: { satUsdCentPrice: 100 * displayCurrencyPerSat },
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
        const wallet = await WalletsRepository().findById(senderWalletId)
        if (wallet instanceof Error) return wallet

        const account = await AccountsRepository().findById(wallet.accountId)
        if (account instanceof Error) return account

        // Notify the recipient (via GraphQL subscription if any)
        const accountUpdatedEventName = accountUpdateEvent(account.id)

        pubsub.publish(accountUpdatedEventName, {
          intraLedger: {
            walletId,
            txNotificationType: type,
            amount,
            displayCurrencyPerSat,
          },
        })

        const user = await UsersRepository().findById(account.ownerId)
        if (user instanceof Error) return user

        // Do not await this call for quicker processing
        transactionNotification({
          type: NotificationType.IntraLedgerPayment,
          user,
          logger,
          amount,
          displayCurrencyPerSat,
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
    userId,
    price,
  }: {
    balance: Satoshis
    userId: UserId
    price: DisplayCurrencyPerSat | ApplicationError
  }): Promise<void> => {
    // Add commas to balancesats
    const balanceSatsAsFormattedString = balance.toLocaleString("en")

    let balanceUsdAsFormattedString: string, title: string
    if (price instanceof Error) {
      logger.warn({ price }, "impossible to fetch price for notification")

      // TODO: i18n
      title = `Your balance is ${balanceSatsAsFormattedString} sats)`
    } else {
      const usdValue = price * balance
      balanceUsdAsFormattedString = usdValue.toLocaleString("en", {
        maximumFractionDigits: 2,
      })

      // TODO: i18n
      title = `Your balance is $${balanceUsdAsFormattedString} (${balanceSatsAsFormattedString} sats)`
    }

    logger.info(
      { balanceSatsAsFormattedString, title, userId },
      `sending balance notification to user`,
    )

    const user = await UsersRepository().findById(userId)
    if (user instanceof Error) {
      logger.warn({ user }, "impossible to fetch user to send transaction")
      return
    }

    await sendNotification({
      user,
      title,
      logger,
    })
  }

  return {
    onChainTransactionReceived,
    onChainTransactionReceivedPending,
    onChainTransactionPayment,
    priceUpdate,
    lnInvoicePaid,
    intraLedgerPaid,
    sendBalance,
  }
}
