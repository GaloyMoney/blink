type NotificationsError = import("./errors").NotificationsError
type NotificationsServiceError = import("./errors").NotificationsServiceError

type NotificationType =
  typeof import("./index").NotificationType[keyof typeof import("./index").NotificationType]

type TransactionNotificationBaseArgs = {
  paymentAmount: PaymentAmount<WalletCurrency>
  displayPaymentAmount?: DisplayPaymentAmount<DisplayCurrency>
}

type TransactionReceivedNotificationBaseArgs = TransactionNotificationBaseArgs & {
  recipientAccountId: AccountId
  recipientWalletId: WalletId
  recipientDeviceTokens?: DeviceToken[]
  recipientLanguage?: UserLanguage
}

type TransactionSentNotificationBaseArgs = TransactionNotificationBaseArgs & {
  senderAccountId: AccountId
  senderWalletId: WalletId
  senderDeviceTokens?: DeviceToken[]
  senderLanguage?: UserLanguage
}

type IntraLedgerTxReceivedArgs = TransactionReceivedNotificationBaseArgs

type LightningTxReceivedArgs = TransactionReceivedNotificationBaseArgs & {
  paymentHash: PaymentHash
}

type OnChainTxBaseArgs = {
  txHash: OnChainTxHash
}

type OnChainTxReceivedArgs = TransactionReceivedNotificationBaseArgs & OnChainTxBaseArgs
type OnChainTxReceivedPendingArgs = TransactionReceivedNotificationBaseArgs &
  OnChainTxBaseArgs
type OnChainTxSentArgs = TransactionSentNotificationBaseArgs & OnChainTxBaseArgs

type SendBalanceArgs = {
  balanceAmount: BalanceAmount<WalletCurrency>
  recipientDeviceTokens: DeviceToken[]
  displayBalanceAmount?: DisplayBalanceAmount<DisplayCurrency>
  recipientLanguage?: UserLanguage
}

interface INotificationsService {
  lightningTxReceived: (
    args: LightningTxReceivedArgs,
  ) => Promise<void | NotificationsServiceError>

  intraLedgerTxReceived: (
    args: IntraLedgerTxReceivedArgs,
  ) => Promise<void | NotificationsServiceError>

  onChainTxReceived(
    args: OnChainTxReceivedArgs,
  ): Promise<void | NotificationsServiceError>
  onChainTxReceivedPending(
    args: OnChainTxReceivedPendingArgs,
  ): Promise<void | NotificationsServiceError>
  onChainTxSent(args: OnChainTxSentArgs): Promise<void | NotificationsServiceError>

  priceUpdate: (DisplayCurrencyPerSat: DisplayCurrencyPerSat) => void
  sendBalance(args: SendBalanceArgs): Promise<void | NotificationsServiceError>
}
