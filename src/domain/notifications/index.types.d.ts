type NotificationsServiceError = import("./errors").NotificationsServiceError

type OnChainTxReceivedArgs = {
  walletId: WalletId
  amount: Satoshis
  txId: TxId
}

type LnPaymentReceivedArgs = {
  walletId: WalletId
  amount: Satoshis
  paymentHash: PaymentHash
}

interface INotificationsService {
  onChainTransactionReceived(
    args: OnChainTxReceivedArgs,
  ): Promise<void | NotificationsServiceError>
  lnPaymentReceived(
    args: LnPaymentReceivedArgs,
  ): Promise<void | NotificationsServiceError>
}
