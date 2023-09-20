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
  recipientNotificationSettings: NotificationSettings
  recipientLanguage: UserLanguageOrEmpty
}

type TransactionSentNotificationBaseArgs = TransactionNotificationBaseArgs & {
  senderAccountId: AccountId
  senderWalletId: WalletId
  senderDeviceTokens: DeviceToken[]
  senderNotificationSettings: NotificationSettings
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
  notificationSettings: NotificationSettings
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
  adminPushNotificationSend(
    args: SendPushNotificationArgs,
  ): Promise<true | NotificationsServiceError>
  adminPushNotificationFilteredSend(
    args: SendFilteredPushNotificationArgs,
  ): Promise<true | NotificationsServiceError>
}

type NotificationChannel =
  (typeof import("./index").NotificationChannel)[keyof typeof import("./index").NotificationChannel]

type NotificationSettings = Record<NotificationChannel, NotificationChannelSettings>

type NotificationChannelSettings = {
  enabled: boolean
  disabledCategories: NotificationCategory[]
}
