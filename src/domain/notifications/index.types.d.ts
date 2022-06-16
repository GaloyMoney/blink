type NotificationsError = import("./errors").NotificationsError
type NotificationsServiceError = import("./errors").NotificationsServiceError

type NotificationType =
  typeof import("./index").NotificationType[keyof typeof import("./index").NotificationType]

type TransactionNotificationBaseArgs = {
  recipientAccountId: AccountId
  recipientWalletId: WalletId
  paymentAmount: PaymentAmount<WalletCurrency>
  displayPaymentAmount?: DisplayPaymentAmount<DisplayCurrency>
  recipientDeviceTokens?: DeviceToken[]
  recipientLanguage?: UserLanguage
}

type OnChainTxBaseArgs = {
  walletId: WalletId
  amount: Satoshis
  txHash: OnChainTxHash
  displayCurrencyPerSat?: DisplayCurrencyPerSat
}

type OnChainTxReceivedArgs = OnChainTxBaseArgs
type OnChainTxReceivedPendingArgs = OnChainTxBaseArgs
type OnChainTxPaymentArgs = OnChainTxBaseArgs

type LightningTxReceivedArgs = TransactionNotificationBaseArgs & {
  paymentHash: PaymentHash
}

type IntraLedgerTxReceivedArgs = TransactionNotificationBaseArgs

type SendBalanceArgs = {
  balance: CurrencyBaseAmount
  walletCurrency: WalletCurrency
  userId: UserId
  displayCurrencyPerSat?: DisplayCurrencyPerSat
}

interface INotificationsService {
  lightningTxReceived: (
    args: LightningTxReceivedArgs,
  ) => Promise<void | NotificationsServiceError>

  intraLedgerTxReceived: (
    args: IntraLedgerTxReceivedArgs,
  ) => Promise<void | NotificationsServiceError>

  onChainTransactionReceived(
    args: OnChainTxReceivedArgs,
  ): Promise<void | NotificationsServiceError>
  onChainTransactionReceivedPending(
    args: OnChainTxReceivedPendingArgs,
  ): Promise<void | NotificationsServiceError>
  onChainTransactionPayment(
    args: OnChainTxPaymentArgs,
  ): Promise<void | NotificationsServiceError>
  priceUpdate: (DisplayCurrencyPerSat: DisplayCurrencyPerSat) => void
  sendBalance(args: SendBalanceArgs): Promise<void | NotImplementedError>
}
