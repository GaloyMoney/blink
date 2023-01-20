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
  recipientDeviceTokens: DeviceToken[]
  recipientLanguage: UserLanguageOrEmpty
}

type TransactionSentNotificationBaseArgs = TransactionNotificationBaseArgs & {
  senderAccountId: AccountId
  senderWalletId: WalletId
  senderDeviceTokens: DeviceToken[]
  senderLanguage: UserLanguageOrEmpty
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
  deviceTokens: DeviceToken[]
  displayBalanceAmount?: DisplayBalanceAmount<DisplayCurrency>
  recipientLanguage: UserLanguageOrEmpty
}

type PriceUpdateArgs = {
  pricePerSat: DisplayCurrencyPerSat
  displayCurrency: DisplayCurrency
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

  priceUpdate: (args: PriceUpdateArgs) => void
  sendBalance(args: SendBalanceArgs): Promise<void | NotificationsServiceError>
}
