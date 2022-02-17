type NotificationsError = import("./errors").NotificationsError
type NotificationsServiceError = import("./errors").NotificationsServiceError

type NotificationType =
  typeof import("./index").NotificationType[keyof typeof import("./index").NotificationType]

type OnChainTxBaseArgs = {
  walletId: WalletId
  amount: Satoshis
  txHash: OnChainTxHash
  displayCurrencyPerSat?: DisplayCurrencyPerSat
}

type OnChainTxReceivedArgs = OnChainTxBaseArgs
type OnChainTxReceivedPendingArgs = OnChainTxBaseArgs
type OnChainTxPaymentArgs = OnChainTxBaseArgs

type LnInvoicePaidArgs = {
  paymentHash: PaymentHash
  recipientWalletId: WalletId
  amount: Satoshis
  displayCurrencyPerSat?: DisplayCurrencyPerSat
}

type IntraLedgerArgs = {
  senderWalletId: WalletId
  recipientWalletId: WalletId
  amount: Satoshis
  displayCurrencyPerSat?: DisplayCurrencyPerSat
}

type SendBalanceArgs = {
  balance: CurrencyBaseAmount
  walletCurrency: WalletCurrency
  userId: UserId
  price: DisplayCurrencyPerSat | ApplicationError
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
  priceUpdate: (DisplayCurrencyPerSat: number) => void
  lnInvoicePaid: (args: LnInvoicePaidArgs) => void
  intraLedgerPaid(args: IntraLedgerArgs): Promise<void | NotificationsServiceError>
  sendBalance(args: SendBalanceArgs): Promise<void | NotImplementedError>
}
