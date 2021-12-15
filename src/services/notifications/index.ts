import {
  lnPaymentStatusEvent,
  SAT_USDCENT_PRICE,
  USER_PRICE_UPDATE_EVENT,
  walletUpdateEvent,
} from "@config/app"

import { NotificationsServiceError, NotificationType } from "@domain/notifications"

import { User } from "@services/mongoose/schema"
import pubsub from "@services/pubsub"

import { transactionNotification } from "./payment"

export const NotificationsService = (logger: Logger): INotificationsService => {
  const sendOnChainNotification = async ({
    type,
    amount,
    walletId,
    txHash,
    usdPerSat,
  }: {
    type: NotificationType
    walletId: WalletId
    amount: Satoshis
    txHash: OnChainTxHash
    usdPerSat?: UsdPerSat
  }): Promise<void | NotificationsServiceError> => {
    try {
      // work around to move forward before re-wrighting the whole notifications module
      const user = await User.findOne({ walletId })

      // Do not await this call for quicker processing
      transactionNotification({
        type,
        user,
        logger,
        amount,
        txHash,
        usdPerSat,
      })

      // Notify the recipient (via GraphQL subscription if any)
      const walletUpdatedEventName = walletUpdateEvent(user.id)

      pubsub.publish(walletUpdatedEventName, {
        transaction: {
          txNotificationType: type,
          amount,
          txHash,
          usdPerSat,
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
    usdPerSat,
  }: OnChainTxReceivedArgs) =>
    sendOnChainNotification({
      type: NotificationType.OnchainReceipt,
      amount,
      walletId,
      txHash,
      usdPerSat,
    })

  const onChainTransactionReceivedPending = async ({
    amount,
    walletId,
    txHash,
    usdPerSat,
  }: OnChainTxReceivedPendingArgs) =>
    sendOnChainNotification({
      type: NotificationType.OnchainReceiptPending,
      amount,
      walletId,
      txHash,
      usdPerSat,
    })

  const onChainTransactionPayment = async ({
    amount,
    walletId,
    txHash,
    usdPerSat,
  }: OnChainTxPaymentArgs) =>
    sendOnChainNotification({
      type: NotificationType.OnchainPayment,
      amount,
      walletId,
      txHash,
      usdPerSat,
    })

  const lnInvoicePaid = async ({
    paymentHash,
    recipientWalletId,
    amount,
    usdPerSat,
  }: LnInvoicePaidArgs) => {
    try {
      // work around to move forward before re-wrighting the whole notifications module
      const user = await User.findOne({ _id: recipientWalletId })

      // Do not await this call for quicker processing
      transactionNotification({
        type: NotificationType.LnInvoicePaid,
        user,
        logger,
        amount,
        paymentHash,
        usdPerSat,
      })
      // Notify public subscribers (via GraphQL subscription if any)
      const eventName = lnPaymentStatusEvent(paymentHash)
      pubsub.publish(eventName, { status: "PAID" })

      // Notify the recipient (via GraphQL subscription if any)
      const walletUpdatedEventName = walletUpdateEvent(recipientWalletId)
      pubsub.publish(walletUpdatedEventName, {
        invoice: {
          paymentHash,
          status: "PAID",
        },
      })
      return
    } catch (err) {
      return new NotificationsServiceError(err)
    }
  }

  const priceUpdate = (usdPerSat) => {
    pubsub.publish(SAT_USDCENT_PRICE, { satUsdCentPrice: 100 * usdPerSat })
    pubsub.publish(USER_PRICE_UPDATE_EVENT, {
      price: { satUsdCentPrice: 100 * usdPerSat },
    })
  }

  const intraLedgerPaid = async ({
    payerWalletId,
    recipientWalletId,
    amount,
    usdPerSat,
  }: IntraLedgerArgs): Promise<void | NotificationsServiceError> => {
    try {
      const publish = async (walletId: WalletId, type: NotificationType) => {
        // Notify the recipient (via GraphQL subscription if any)
        const walletUpdatedEventName = walletUpdateEvent(walletId)

        pubsub.publish(walletUpdatedEventName, {
          intraLedger: {
            txNotificationType: type,
            amount,
            usdPerSat,
          },
        })
      }

      publish(payerWalletId, NotificationType.IntraLedgerPayment)
      publish(recipientWalletId, NotificationType.IntraLedgerReceipt)

      // work around to move forward before re-wrighting the whole notifications module
      const payerUser = await User.findOne({ _id: payerWalletId })

      // Do not await this call for quicker processing
      transactionNotification({
        type: NotificationType.IntraLedgerPayment,
        user: payerUser,
        logger,
        amount,
        usdPerSat,
      })

      const recipientUser = await User.findOne({ _id: recipientWalletId })

      // Do not await this call for quicker processing
      transactionNotification({
        type: NotificationType.IntraLedgerReceipt,
        user: recipientUser,
        logger,
        amount,
        usdPerSat,
      })
    } catch (err) {
      return new NotificationsServiceError(err)
    }
  }

  return {
    onChainTransactionReceived,
    onChainTransactionReceivedPending,
    onChainTransactionPayment,

    priceUpdate,
    lnInvoicePaid,
    intraLedgerPaid,
  }
}
