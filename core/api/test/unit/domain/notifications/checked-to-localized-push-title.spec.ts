import { checkedToLocalizedPushTitle } from "@/domain/notifications"
import { InvalidPushTitleError } from "@/domain/notifications/errors"

describe("localized push title check", () => {
  it("passes when title is valid", () => {
    const title = "Circle Grew"
    expect(checkedToLocalizedPushTitle("Circle Grew")).toBe(title)
  })

  it("fails when title is empty", () => {
    expect(checkedToLocalizedPushTitle("")).toBeInstanceOf(InvalidPushTitleError)
  })
})
