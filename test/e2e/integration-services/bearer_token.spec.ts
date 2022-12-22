import { kratosAdmin } from "@services/kratos/private"

import { AuthWithBearerTokenService } from "@services/kratos/auth-bearer-token"

import { randomPhone } from "test/helpers"

/*
    FLOW:

    const mapping: { [key: string]: string } = {}

    // initiate graphql call with DevideId
    // on mobile
    const deviceId = randomUUID()
    graphql.initiateTokenBearer(deviceId, notificationToken)

    // on backend
    const challenge = randomUUID()
    mapping[deviceId] = challenge
    sendNotification(notificationToken, challenge) // data notification

    // validateTokenBearer
    // on mobile
    graphql.validateTokenBearer(challenge)

    // on backend
    if (mapping[deviceId] == challenge) {
      const kratostoken = generateKratosIdentity()
      return kratostoken
    }

*/

// look at approov.io?

describe("bearer_token", () => {
  const authService = AuthWithBearerTokenService()
  let kratosUserId: UserId

  it("create a user", async () => {
    const res = await authService.create()
    if (res instanceof Error) throw res

    expect(res).toHaveProperty("sessionToken")

    kratosUserId = res.kratosUserId

    const { data: identity } = await kratosAdmin.getIdentity({ id: kratosUserId })
    expect(identity.schema_id).toBe("bearer_token")
  })

  it("upgrade user", async () => {
    // TODO: test if there is a phone (or phone+email) collision
    await authService.upgradeToPhoneSchema({ kratosUserId, phone: randomPhone() })

    const { data: identity } = await kratosAdmin.getIdentity({ id: kratosUserId })
    expect(identity.schema_id).toBe("phone_no_password_v0")
  })
})
