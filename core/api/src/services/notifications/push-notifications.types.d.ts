type SendFilteredPushNotificationStatus =
  (typeof import("./push-notifications").SendFilteredPushNotificationStatus)[keyof typeof import("./push-notifications").SendFilteredPushNotificationStatus]

type PushNotificationArgs = {
  deviceTokens: DeviceToken[]
  title: string
  body: string
  data?: { [key: string]: string }
}

type FilteredPushNotificationArgs = PushNotificationArgs & {
  userId: UserId
  notificationCategory: NotificationCategory
}

interface IPushNotificationSenderService {
  sendNotification(args: PushNotificationArgs): Promise<true | NotificationsServiceError>

  sendFilteredNotification(args: FilteredPushNotificationArgs): Promise<
    | {
        status: SendFilteredPushNotificationStatus
      }
    | NotificationsServiceError
  >
}
