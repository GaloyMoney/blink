import { maybeExtendSession } from "@/app/authentication"
import { extendSession } from "@/services/kratos"

jest.mock("@/services/kratos", () => {
  return {
    extendSession: jest.fn(),
  }
})

it("maybe extend session", async () => {
  {
    // token in 9 month, should be renew
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 9)

    const sessionId = "id"

    await maybeExtendSession({
      sessionId,
      expiresAt: expiresAt.toISOString(),
    })

    expect(extendSession).toHaveBeenCalledTimes(1)
  }

  {
    // token in 13 month, should not be renew
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 13)

    const sessionId = "id"

    await maybeExtendSession({
      sessionId,
      expiresAt: expiresAt.toISOString(),
    })

    // counter should not increase
    expect(extendSession).toHaveBeenCalledTimes(1)
  }
})
