import { checkedToNotificationCategory } from "@/domain/notifications"
import { InvalidPushNotificationSettingError } from "@/domain/notifications/errors"

describe("notification category check", () => {
  it("passes when category is valid", () => {
    const category = "Circles"
    expect(checkedToNotificationCategory("Circles")).toBe(category)
  })

  it("fails when category is invalid", () => {
    expect(checkedToNotificationCategory("")).toBeInstanceOf(
      InvalidPushNotificationSettingError,
    )
  })
})
