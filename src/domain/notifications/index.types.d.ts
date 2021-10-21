type NotificationsError = import("./errors").NotificationsError
type NotificationsServiceError = import("./errors").NotificationsServiceError

type NotificationType =
  typeof import("./index").NotificationType[keyof typeof import("./index").NotificationType]

type OnChainTxBaseArgs = {
  walletId: WalletId
  amount: Satoshis
  txHash: OnChainTxHash
  usdPerSat?: UsdPerSat
}

type OnChainTxReceivedArgs = OnChainTxBaseArgs
type OnChainTxReceivedPendingArgs = OnChainTxBaseArgs
type OnChainTxPaymentArgs = OnChainTxBaseArgs

type LnPaymentReceivedArgs = {
  walletId: WalletId
  amount: Satoshis
  paymentHash: PaymentHash
  usdPerSat?: UsdPerSat
}

interface INotificationsService {
  onChainTransactionReceived(
    args: OnChainTxReceivedArgs,
  ): Promise<void | NotificationsServiceError>
  onChainTransactionReceivedPending(
    args: OnChainTxReceivedPendingArgs,
  ): Promise<void | NotificationsServiceError>
  onChainTransactionPayment(
    args: OnChainTxPaymentArgs,
  ): Promise<void | NotificationsServiceError>
  lnPaymentReceived(
    args: LnPaymentReceivedArgs,
  ): Promise<void | NotificationsServiceError>
}
