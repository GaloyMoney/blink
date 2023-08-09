type NotificationsError = import("./errors").NotificationsError
type NotificationsServiceError = import("./errors").NotificationsServiceError

type NotificationType =
  (typeof import("./index").NotificationType)[keyof typeof import("./index").NotificationType]

type TransactionNotificationBaseArgs = {
  paymentAmount: PaymentAmount<WalletCurrency>
  displayPaymentAmount?: DisplayAmount<DisplayCurrency>
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
  displayBalanceAmount?: DisplayAmount<DisplayCurrency>
  recipientLanguage: UserLanguageOrEmpty
}

type PriceUpdateArgs<C extends DisplayCurrency> = {
  pricePerSat: RealTimePrice<C>
  pricePerUsdCent: RealTimePrice<C>
}

interface INotificationsService {
  lightningTxReceived: (
    args: LightningTxReceivedArgs,
  ) => Promise<true | NotificationsServiceError>

  intraLedgerTxReceived: (
    args: IntraLedgerTxReceivedArgs,
  ) => Promise<true | NotificationsServiceError>

  onChainTxReceived(
    args: OnChainTxReceivedArgs,
  ): Promise<true | NotificationsServiceError>
  onChainTxReceivedPending(
    args: OnChainTxReceivedPendingArgs,
  ): Promise<true | NotificationsServiceError>
  onChainTxSent(args: OnChainTxSentArgs): Promise<true | NotificationsServiceError>

  priceUpdate: <C extends DisplayCurrency>(args: PriceUpdateArgs<C>) => void
  sendBalance(args: SendBalanceArgs): Promise<true | NotificationsServiceError>
}
