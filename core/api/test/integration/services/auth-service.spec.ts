import { AuthWithPhonePasswordlessService } from "@/services/kratos"

import { randomPhone } from "test/helpers"

describe("phoneNoPassword", () => {
  const authService = AuthWithPhonePasswordlessService()

  describe("public selflogin api", () => {
    it("create a user", async () => {
      const phone = randomPhone()
      const res = await authService.createIdentityWithSession({ phone })
      if (res instanceof Error) throw res

      expect(res).toHaveProperty("kratosUserId")
    })
  })
})
