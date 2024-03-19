import { checkedToLocalizedPushBody } from "@/domain/notifications"
import { InvalidPushBodyError } from "@/domain/notifications/errors"

describe("localized push body check", () => {
  it("passes when body in valid", () => {
    const body = "Your inner circle grew!"
    expect(checkedToLocalizedPushBody("Your inner circle grew!")).toBe(body)
  })

  it("fails when body is empty", () => {
    expect(checkedToLocalizedPushBody("")).toBeInstanceOf(InvalidPushBodyError)
  })
})
