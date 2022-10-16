type SendPushNotificationArgs = {
  deviceTokens: DeviceToken[]
  title: string
  body?: string
  data?: { [key: string]: string }
}

interface IPushNotificationsService {
  sendNotification({
    deviceTokens,
    title,
    body,
    data,
  }: SendPushNotificationArgs): Promise<true | NotificationsServiceError>
}
