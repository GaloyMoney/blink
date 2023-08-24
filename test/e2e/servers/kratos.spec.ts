import { AuthWithPhonePasswordlessService, validateKratosToken } from "@services/kratos"
import { kratosPublic } from "@services/kratos/private"

import { getError, randomPhone } from "test/helpers"

beforeAll(async () => {
  // await removeIdentities()
  // needed for the kratos callback to registration
  // serverPid = await startServer("start-main-ci")
})

afterAll(async () => {
  // await killServer(serverPid)
})

describe("phoneNoPassword", () => {
  const authService = AuthWithPhonePasswordlessService()

  describe("public selflogin api", () => {
    it("forbidding change of a phone number from publicApi", async () => {
      const phone = randomPhone()

      const res = await authService.createIdentityWithSession({ phone })
      if (res instanceof Error) throw res

      const res1 = await validateKratosToken(res.authToken)
      if (res1 instanceof Error) throw res1
      expect(res1.session.identity.phone).toStrictEqual(phone)

      const res2 = await kratosPublic.createNativeSettingsFlow({
        xSessionToken: res.authToken,
      })

      const newPhone = randomPhone()

      const err = await getError(() =>
        kratosPublic.updateSettingsFlow({
          flow: res2.data.id,
          updateSettingsFlowBody: {
            method: "profile",
            traits: {
              phone: newPhone,
            },
          },
          xSessionToken: res.authToken,
        }),
      )

      expect(err).toBeTruthy()
    })
  })
})
