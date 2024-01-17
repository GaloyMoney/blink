import { GaloyNotificationCategories } from "@/domain/notifications"
import { NotificationsService } from "@/services/notifications"
import { randomUserId } from "test/helpers"
import {
  PushNotificationsService,
  SendFilteredPushNotificationStatus,
} from "@/services/notifications/push-notifications"

const notificationService = NotificationsService()
const pushNotificationService = PushNotificationsService()

describe("PushNotificationService", () => {
  it("should filter a push notification", async () => {
    const userId = randomUserId()
    await notificationService.disableNotificationChannel({
      userId,
      notificationChannel: "push",
    })
    const result = await pushNotificationService.sendFilteredNotification({
      body: "body",
      title: "title",
      deviceTokens: ["deviceToken" as DeviceToken],
      notificationCategory: GaloyNotificationCategories.Payments,
      userId,
    })

    if (result instanceof Error) {
      throw result
    }

    expect(result).toEqual({
      status: SendFilteredPushNotificationStatus.Filtered,
    })
  })
})
