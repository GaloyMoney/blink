import { NotificationsServiceError, NotificationType } from "@domain/notifications"
import { User } from "@services/mongoose/schema"
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
      const user = await User.findOne({ _id: walletId })

      // Do not await this call for quicker processing
      transactionNotification({
        type,
        user,
        logger,
        amount,
        txid: txHash,
        usdPerSat,
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

  const lnPaymentReceived = async ({
    amount,
    walletId,
    paymentHash,
    usdPerSat,
  }: LnPaymentReceivedArgs) => {
    try {
      // work around to move forward before re-wrighting the whole notifications module
      const user = await User.findOne({ _id: walletId })

      // Do not await this call for quicker processing
      transactionNotification({
        type: NotificationType.LnInvoicePaid,
        user,
        logger,
        amount,
        hash: paymentHash,
        usdPerSat,
      })
      return
    } catch (err) {
      return new NotificationsServiceError(err)
    }
  }

  return {
    onChainTransactionReceived,
    onChainTransactionReceivedPending,
    onChainTransactionPayment,
    lnPaymentReceived,
  }
}
