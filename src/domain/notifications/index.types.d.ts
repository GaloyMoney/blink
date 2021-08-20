type NotificationsServiceError = import("./errors").NotificationsServiceError

type TransactionReceivedArgs = {
  walletId: WalletId
  amount: Satoshis
  txId: TxId
}

interface INotificationsService {
  onChainTransactionReceived(
    args: TransactionReceivedArgs,
  ): Promise<void | NotificationsServiceError>
}
