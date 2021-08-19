type NotificationsServiceError = import("./errors").NotificationsServiceError

type TransactionReceivedArgs = {
  type: LedgerTransactionType
  userId: UserId
  amount: Satoshis
  txId: TxId
}

interface INotificationsService {
  transactionReceived(
    args: TransactionReceivedArgs,
  ): Promise<void | NotificationsServiceError>
}
