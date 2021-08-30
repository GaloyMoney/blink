import { LedgerTransactionType } from "@domain/ledger"
import { NotificationsServiceError } from "@domain/notifications"
import { User } from "@services/mongoose/schema"
import { transactionNotification } from "./payment"

export const NotificationsService = (logger: Logger): INotificationsService => {
  const onChainTransactionReceived = async ({
    amount,
    walletId,
    txId,
  }: OnChainTxReceivedArgs) => {
    try {
      // work around to move forward before re-wrighting the whole notifications module
      const user = await User.findOne({ _id: walletId })

      // Do not await this call for quicker processing
      transactionNotification({
        type: LedgerTransactionType.OnchainReceipt,
        user,
        logger: logger,
        amount,
        txid: txId,
      })
      return
    } catch (err) {
      return new NotificationsServiceError(err)
    }
  }

  const lnPaymentReceived = async ({
    amount,
    walletId,
    paymentHash,
  }: LnPaymentReceivedArgs) => {
    try {
      // work around to move forward before re-wrighting the whole notifications module
      const user = await User.findOne({ _id: walletId })

      // Do not await this call for quicker processing
      transactionNotification({
        type: "paid-invoice",
        user,
        logger: logger,
        amount,
        hash: paymentHash,
      })
      return
    } catch (err) {
      return new NotificationsServiceError(err)
    }
  }

  return { onChainTransactionReceived, lnPaymentReceived }
}
