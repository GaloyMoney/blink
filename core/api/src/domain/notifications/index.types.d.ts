type NotificationsError = import("./errors").NotificationsError
type NotificationsServiceError = import("./errors").NotificationsServiceError

type NotificationType =
  (typeof import("./index").NotificationType)[keyof typeof import("./index").NotificationType]

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

type NotificationChannel =
  (typeof import("./index").NotificationChannel)[keyof typeof import("./index").NotificationChannel]

type NotificationSettings = Record<NotificationChannel, NotificationChannelSettings>

type NotificationChannelSettings = {
  enabled: boolean
  disabledCategories: NotificationCategory[]
}

type NotificationRecipient = {
  accountId: AccountId
  walletId: WalletId
  deviceTokens: DeviceToken[]
  notificationSettings: NotificationSettings
  language: UserLanguageOrEmpty
}

type NotificatioSendTransactionArgs = {
  recipient: NotificationRecipient
  transaction: WalletTransaction
}

interface INotificationsService {
  sendTransaction: (
    args: NotificatioSendTransactionArgs,
  ) => Promise<true | NotificationsServiceError>
  sendBalance(args: SendBalanceArgs): Promise<true | NotificationsServiceError>
  priceUpdate: <C extends DisplayCurrency>(args: PriceUpdateArgs<C>) => void
  adminPushNotificationSend(
    args: SendPushNotificationArgs,
  ): Promise<true | NotificationsServiceError>
  adminPushNotificationFilteredSend(
    args: SendFilteredPushNotificationArgs,
  ): Promise<true | NotificationsServiceError>
}
