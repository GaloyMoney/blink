import { AuthWithPhonePasswordlessService } from "@services/kratos"

import { randomPhone } from "test/helpers"
import { killServer, startServer } from "test/helpers/server"

let serverPid: PID

beforeAll(async () => {
  // needed for the kratos callback to registration
  serverPid = await startServer("start-main-ci")
})

afterAll(async () => {
  await killServer(serverPid)
})

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
