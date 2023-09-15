import { shouldSendPushNotification } from "@services/notifications/push-notification-filtering"

describe("Notifications - push notification filtering", () => {
  describe("shouldSendPushNotification", () => {
    it("returns false when push notifications are disabled", () => {
      const pushNotificationSettings = {
        pushNotificationsEnabled: false,
        disabledPushNotificationTypes: [],
      }

      const pushNotificationType = "transaction" as PushNotificationType

      expect(
        shouldSendPushNotification({
          pushNotificationSettings,
          pushNotificationType,
        }),
      ).toBe(false)
    })
  })

  it("returns true when a notification is not disabled", () => {
    const pushNotificationSettings = {
      pushNotificationsEnabled: true,
      disabledPushNotificationTypes: [],
    }

    const pushNotificationType = "transaction" as PushNotificationType

    expect(
      shouldSendPushNotification({
        pushNotificationSettings,
        pushNotificationType,
      }),
    ).toBe(true)
  })

  it("returns false when a notification is disabled", () => {
    const pushNotificationSettings = {
      pushNotificationsEnabled: true,
      disabledPushNotificationTypes: ["transaction" as PushNotificationType],
    }

    const pushNotificationType = "transaction" as PushNotificationType

    expect(
      shouldSendPushNotification({
        pushNotificationSettings,
        pushNotificationType,
      }),
    ).toBe(false)
  })
})
