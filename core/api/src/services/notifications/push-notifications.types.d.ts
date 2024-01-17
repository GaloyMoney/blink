type SendPushNotificationArgs = {
  deviceTokens: DeviceToken[]
  title: string
  body: string
  data?: { [key: string]: string }
}

type SendFilteredPushNotificationArgs = {
  deviceTokens: DeviceToken[]
  title: string
  body: string
  data?: { [key: string]: string }
  userId: UserId
  notificationCategory: NotificationCategory
}

type SendFilteredPushNotificationStatus =
  (typeof import("./push-notifications").SendFilteredPushNotificationStatus)[keyof typeof import("./push-notifications").SendFilteredPushNotificationStatus]

interface IPushNotificationsService {
  sendNotification({
    deviceTokens,
    title,
    body,
    data,
  }: SendPushNotificationArgs): Promise<true | NotificationsServiceError>

  sendFilteredNotification(args: SendFilteredPushNotificationArgs): Promise<
    | {
        status: SendFilteredPushNotificationStatus
      }
    | NotificationsServiceError
  >
}
