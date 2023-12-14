import {
  PushNotificationsService,
  SendFilteredPushNotificationStatus,
} from "@/services/notifications/push-notifications"

describe("push notification", () => {
  it("should filter a notification", async () => {
    const notificationCategory = "transaction" as NotificationCategory
    const notificationSettings = {
      push: {
        enabled: true,
        disabledCategories: [notificationCategory],
      },
    }

    const result = await PushNotificationsService().sendFilteredNotification({
      body: "body",
      title: "title",
      deviceTokens: ["deviceToken" as DeviceToken],
      notificationCategory,
      notificationSettings,
    })

    expect(result).toEqual({
      status: SendFilteredPushNotificationStatus.Filtered,
    })
  })
})
