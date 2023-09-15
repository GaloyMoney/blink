import {
  PushNotificationsService,
  SendFilteredPushNotificationStatus,
} from "@services/notifications/push-notifications"

describe("push notification", () => {
  it("should filter a notification", async () => {
    const pushNotificationType = "transaction" as PushNotificationType
    const pushNotificationSettings = {
      pushNotificationsEnabled: true,
      disabledPushNotificationTypes: [pushNotificationType],
    }

    const result = await PushNotificationsService().sendFilteredNotification({
      body: "body",
      title: "title",
      deviceTokens: ["deviceToken" as DeviceToken],
      pushNotificationType,
      pushNotificationSettings,
    })

    expect(result).toBe({
      status: SendFilteredPushNotificationStatus.Filtered,
    })
  })
})
