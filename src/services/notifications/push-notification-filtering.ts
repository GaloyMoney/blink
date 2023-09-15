export const shouldSendPushNotification = ({
  pushNotificationSettings,
  pushNotificationType,
}: {
  pushNotificationSettings: PushNotificationSettings
  pushNotificationType: PushNotificationType
}): boolean => {
  if (pushNotificationSettings.pushNotificationsEnabled) {
    return !pushNotificationSettings.disabledPushNotificationTypes.includes(
      pushNotificationType,
    )
  }

  return false
}
