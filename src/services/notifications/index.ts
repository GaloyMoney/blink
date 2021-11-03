import { NotificationsServiceError, NotificationType } from "@domain/notifications"
import { User } from "@services/mongoose/schema"
import { transactionNotification } from "./payment"

export const NotificationsService = (logger: Logger): INotificationsService => {
  const sendOnChainNotification = async ({
    type,
    amount,
    walletId,
    txId,
    usdPerSat,
  }: {
    type: NotificationType
    walletId: WalletId
    amount: Satoshis
    txId: TxId
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
        txid: txId,
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
    txId,
    usdPerSat,
  }: OnChainTxReceivedArgs) =>
    sendOnChainNotification({
      type: NotificationType.OnchainReceipt,
      amount,
      walletId,
      txId,
      usdPerSat,
    })

  const onChainTransactionReceivedPending = async ({
    amount,
    walletId,
    txId,
    usdPerSat,
  }: OnChainTxReceivedPendingArgs) =>
    sendOnChainNotification({
      type: NotificationType.OnchainReceiptPending,
      amount,
      walletId,
      txId,
      usdPerSat,
    })

  const onChainTransactionPayment = async ({
    amount,
    walletId,
    txId,
    usdPerSat,
  }: OnChainTxPaymentArgs) =>
    sendOnChainNotification({
      type: NotificationType.OnchainPayment,
      amount,
      walletId,
      txId,
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
