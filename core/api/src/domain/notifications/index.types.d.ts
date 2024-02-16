type NotificationsError = import("./errors").NotificationsError
type NotificationsServiceError = import("./errors").NotificationsServiceError

type NotificationType =
  (typeof import("./index").NotificationType)[keyof typeof import("./index").NotificationType]

type SendBalanceArgs = {
  balanceAmount: BalanceAmount<WalletCurrency>
  recipientUserId: UserId
  displayBalanceAmount?: DisplayAmount<DisplayCurrency>
}

type PriceUpdateArgs<C extends DisplayCurrency> = {
  pricePerSat: RealTimePrice<C>
  pricePerUsdCent: RealTimePrice<C>
}

type NotificationChannel =
  (typeof import("./index").NotificationChannel)[keyof typeof import("./index").NotificationChannel]

type NotificationSettings = Record<NotificationChannel, NotificationChannelSettings> & {
  language: UserLanguageOrEmpty
  pushDeviceTokens: DeviceToken[]
}

type NotificationChannelSettings = {
  enabled: boolean
  disabledCategories: NotificationCategory[]
}

type NotificationRecipient = {
  accountId: AccountId
  userId: UserId
  walletId: WalletId
  level: AccountLevel
}

type NotificatioSendTransactionArgs = {
  recipient: NotificationRecipient
  transaction: WalletTransaction
}
type SendPushNotificationArgs = {
  title: string
  body: string
  data?: { [key: string]: string }
  userId: UserId
}

type SendFilteredPushNotificationArgs = {
  title: string
  body: string
  data?: { [key: string]: string }
  userId: UserId
  notificationCategory: NotificationCategory
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

  getUserNotificationSettings(
    userId: UserId,
  ): Promise<NotificationSettings | NotificationsServiceError>

  updateUserLanguage(args: {
    userId: UserId
    language: UserLanguageOrEmpty
  }): Promise<NotificationSettings | NotificationsServiceError>

  enableNotificationChannel(args: {
    userId: UserId
    notificationChannel: NotificationChannel
  }): Promise<NotificationSettings | NotificationsServiceError>

  disableNotificationChannel(args: {
    userId: UserId
    notificationChannel: NotificationChannel
  }): Promise<NotificationSettings | NotificationsServiceError>

  enableNotificationCategory(args: {
    userId: UserId
    notificationChannel: NotificationChannel
    notificationCategory: NotificationCategory
  }): Promise<NotificationSettings | NotificationsServiceError>

  disableNotificationCategory(args: {
    userId: UserId
    notificationChannel: NotificationChannel
    notificationCategory: NotificationCategory
  }): Promise<NotificationSettings | NotificationsServiceError>

  addPushDeviceToken(args: {
    userId: UserId
    deviceToken: DeviceToken
  }): Promise<NotificationSettings | NotificationsServiceError>

  removePushDeviceToken(args: {
    userId: UserId
    deviceToken: DeviceToken
  }): Promise<NotificationSettings | NotificationsServiceError>

  updateEmailAddress(args: {
    userId: UserId
    email: EmailAddress
  }): Promise<true | NotificationsServiceError>

  removeEmailAddress(args: { userId: UserId }): Promise<true | NotificationsServiceError>
}
