type NotificationsError = import("./errors").NotificationsError
type NotificationsServiceError = import("./errors").NotificationsServiceError

type NotificationType =
  typeof import("./index").NotificationType[keyof typeof import("./index").NotificationType]

type OnChainTxBaseArgs = {
  walletId: WalletId
  amount: Satoshis
  txHash: OnChainTxHash
  satPerUsd?: SatPerUsd
}

type OnChainTxReceivedArgs = OnChainTxBaseArgs
type OnChainTxReceivedPendingArgs = OnChainTxBaseArgs
type OnChainTxPaymentArgs = OnChainTxBaseArgs

type LnInvoicePaidArgs = {
  paymentHash: PaymentHash
  recipientWalletId: WalletId
  amount: Satoshis
  satPerUsd?: SatPerUsd
}

type IntraLedgerArgs = {
  senderWalletId: WalletId
  recipientWalletId: WalletId
  amount: Satoshis
  satPerUsd?: SatPerUsd
}

type SendBalanceArgs = {
  balance: Satoshis
  userId: UserId
  price: SatPerUsd | ApplicationError
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
  priceUpdate: (SatPerUsd: number) => void
  lnInvoicePaid: (args: LnInvoicePaidArgs) => void
  intraLedgerPaid(args: IntraLedgerArgs): Promise<void | NotificationsServiceError>
  sendBalance(args: SendBalanceArgs): Promise<void>
}
