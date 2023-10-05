import {
  NotificationChannel,
  disableNotificationCategory,
  enableNotificationChannel,
  disableNotificationChannel,
  shouldSendNotification,
} from "@/domain/notifications"

describe("Notifications - push notification filtering", () => {
  describe("shouldSendPushNotification", () => {
    it("returns false when push notifications are disabled", () => {
      const notificationSettings: NotificationSettings = {
        push: {
          enabled: false,
          disabledCategories: [],
        },
      }

      const notificationCategory = "transaction" as NotificationCategory

      expect(
        shouldSendNotification({
          notificationSettings,
          notificationCategory,
          notificationChannel: NotificationChannel.Push,
        }),
      ).toBe(false)
    })

    it("returns true when a notification is not disabled", () => {
      const notificationSettings: NotificationSettings = {
        push: {
          enabled: true,
          disabledCategories: [],
        },
      }

      const notificationCategory = "transaction" as NotificationCategory

      expect(
        shouldSendNotification({
          notificationSettings,
          notificationCategory,
          notificationChannel: NotificationChannel.Push,
        }),
      ).toBe(true)
    })

    it("returns false when a notification is disabled", () => {
      const notificationCategory = "transaction" as NotificationCategory

      const notificationSettings: NotificationSettings = {
        push: {
          enabled: true,
          disabledCategories: [notificationCategory],
        },
      }

      expect(
        shouldSendNotification({
          notificationSettings,
          notificationCategory,
          notificationChannel: NotificationChannel.Push,
        }),
      ).toBe(false)
    })
  })

  describe("enableNotificationChannel", () => {
    it("clears disabled categories when enabling a channel", () => {
      const notificationSettings: NotificationSettings = {
        push: {
          enabled: false,
          disabledCategories: ["transaction" as NotificationCategory],
        },
      }

      const notificationChannel = NotificationChannel.Push

      const result = enableNotificationChannel({
        notificationSettings,
        notificationChannel,
      })

      expect(result).toEqual({
        push: {
          enabled: true,
          disabledCategories: [],
        },
      })
    })
  })

  describe("disableNotificationChannel", () => {
    it("clears disabled categories when disabling a channel", () => {
      const notificationSettings: NotificationSettings = {
        push: {
          enabled: true,
          disabledCategories: ["transaction" as NotificationCategory],
        },
      }

      const notificationChannel = NotificationChannel.Push

      const result = disableNotificationChannel({
        notificationSettings,
        notificationChannel,
      })

      expect(result).toEqual({
        push: {
          enabled: false,
          disabledCategories: [],
        },
      })
    })
  })

  describe("disableNotificationCategoryForChannel", () => {
    it("adds a category to the disabled categories", () => {
      const notificationSettings: NotificationSettings = {
        push: {
          enabled: true,
          disabledCategories: [],
        },
      }

      const notificationChannel = NotificationChannel.Push

      const notificationCategory = "transaction" as NotificationCategory

      const result = disableNotificationCategory({
        notificationSettings,
        notificationChannel,
        notificationCategory,
      })

      expect(result).toEqual({
        push: {
          enabled: true,
          disabledCategories: [notificationCategory],
        },
      })
    })

    it("does not add a category to the disabled categories if it is already there", () => {
      const notificationCategory = "transaction" as NotificationCategory

      const notificationSettings: NotificationSettings = {
        push: {
          enabled: true,
          disabledCategories: [notificationCategory],
        },
      }

      const notificationChannel = NotificationChannel.Push

      const result = disableNotificationCategory({
        notificationSettings,
        notificationChannel,
        notificationCategory,
      })

      expect(result).toEqual({
        push: {
          enabled: true,
          disabledCategories: [notificationCategory],
        },
      })
    })
  })
})
