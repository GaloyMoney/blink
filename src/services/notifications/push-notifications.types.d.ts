type SendPushNotificationArgs = {
  deviceToken: string | string[]
  title: string
  body?: string
  data?: { [key: string]: string }
}

interface IPushNotificationsService {
  sendNotification({
    deviceToken,
    title,
    body,
    data,
  }: SendPushNotificationArgs): Promise<true | NotificationsServiceError>
}
