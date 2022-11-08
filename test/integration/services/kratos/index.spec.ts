import { getKratosMasterPhonePassword } from "@config"
import {
  AuthenticationKratosError,
  LikelyNoUserWithThisPhoneExistError,
  LikelyUserAlreadyExistError,
} from "@domain/authentication/errors"
import { AdminCreateIdentityBody } from "@ory/client"
import {
  AuthWithPhonePasswordlessService,
  extendSession,
  getNextPage,
  listIdentities,
  listSessions,
  validateKratosToken,
} from "@services/kratos"
import {
  activateUser,
  addTotp,
  deactivateUser,
  elevatingSessionWithTotp,
  listIdentitySchemas,
  revokeSessions,
} from "@services/kratos/tests-but-not-prod"
import { kratosAdmin, kratosPublic } from "@services/kratos/private"
import { baseLogger } from "@services/logger"
import { authenticator } from "otplib"

import { randomEmail, randomPassword, randomPhone } from "test/helpers"

describe("phoneNoPassword", () => {
  const authService = AuthWithPhonePasswordlessService()

  describe("public selflogin api", () => {
    const phone = randomPhone()
    let kratosUserId: KratosUserId

    it("create a user", async () => {
      const res = await authService.createIdentityWithSession(phone)
      if (res instanceof Error) throw res

      expect(res).toHaveProperty("kratosUserId")
      kratosUserId = res.kratosUserId
    })

    it("can't create user twice", async () => {
      const res = await authService.createIdentityWithSession(phone)

      expect(res).toBeInstanceOf(LikelyUserAlreadyExistError)
    })

    it("login user succeed if user exists", async () => {
      const res = await authService.login(phone)
      if (res instanceof Error) throw res

      expect(res.kratosUserId).toBe(kratosUserId)
    })

    it("new sessions are added when LoginWithPhoneNoPasswordSchema is used", async () => {
      const res = await authService.login(phone)
      if (res instanceof Error) throw res

      expect(res.kratosUserId).toBe(kratosUserId)
      const sessions = await listSessions(kratosUserId)
      if (sessions instanceof Error) throw sessions

      expect(sessions).toHaveLength(3)
    })

    it("add totp", async () => {
      const phone = randomPhone()

      let totpSecret: string
      {
        const res0 = await authService.createIdentityWithSession(phone)
        if (res0 instanceof Error) throw res0

        const session = res0.sessionToken

        const res1 = await addTotp(session)
        if (res1 instanceof Error) throw res1

        totpSecret = res1

        const res2 = await validateKratosToken(session)
        res2
        // TODO
        // expect(res2.aal).toBe("aal2")
      }

      {
        // FIXME: tmp for test.
        // NB: I don't think it make sense to have 2fa for paasswordless schema
        // but the test is still useful to know how to use kratos for 2fa
        const password = getKratosMasterPhonePassword()

        const res = await authService.login(phone)
        if (res instanceof Error) throw res

        const session = res.sessionToken

        await elevatingSessionWithTotp({
          session,
          code: authenticator.generate(totpSecret),
          password,
        })
      }
    })

    it("login fails is user doesn't exist", async () => {
      const phone = randomPhone()
      const res = await authService.login(phone)
      expect(res).toBeInstanceOf(LikelyNoUserWithThisPhoneExistError)
    })

    it("change user from passwordless to password", async () => {
      const phone = randomPhone()
      const password = randomPassword()

      const res0 = await authService.createIdentityWithSession(phone)
      if (res0 instanceof Error) throw res0
      const { kratosUserId } = res0

      const res = await authService.upgradeToPhoneWithPasswordSchema({
        kratosUserId,
        password,
      })
      if (res instanceof Error) throw res

      const newIdentity = await kratosAdmin.adminGetIdentity(kratosUserId)
      expect(newIdentity.data.schema_id).toBe("phone_with_password_v0")
    })
  })

  describe("admin api", () => {
    it("create a user with admin api, and can login with self api", async () => {
      const phone = randomPhone()
      const kratosUserId = await authService.createIdentityNoSession(phone)
      if (kratosUserId instanceof Error) throw kratosUserId

      const res2 = await authService.login(phone)
      if (res2 instanceof Error) throw res2

      expect(res2.kratosUserId).toBe(kratosUserId)
    })
  })

  it("borbidding change of a phone number from publicApi", async () => {
    const phone = randomPhone()

    const res = await authService.createIdentityWithSession(phone)
    if (res instanceof Error) throw res

    const res1 = await validateKratosToken(res.sessionToken)
    if (res1 instanceof Error) throw res1
    expect(res1.session.identity.phone).toStrictEqual(phone)

    const res2 = await kratosPublic.initializeSelfServiceSettingsFlowWithoutBrowser(
      res.sessionToken,
    )

    const newPhone = randomPhone()

    try {
      await kratosPublic.submitSelfServiceSettingsFlow(
        res2.data.id,
        {
          method: "profile",
          traits: {
            phone: newPhone,
          },
        },
        res.sessionToken,
      )

      // should throw
      expect(true).toBeFalsy()
    } catch (err) {
      expect(true).toBeTruthy()
      baseLogger.debug({ err }, "err impossible to update profile")
    }

    // should pass if kratos.yaml/serve.selfservice.after.profile is been deleted

    // const res3 = await validateKratosToken(res.sessionToken)
    // if (res3 instanceof Error) throw res3
    // expect(res3.session.identity.traits).toStrictEqual({ phone: newPhone })
  })
})

it("list users", async () => {
  const res = await listIdentities()
  if (res instanceof Error) throw res
})

const authService = AuthWithPhonePasswordlessService()

describe("token validation", () => {
  it("validate bearer token", async () => {
    const phone = randomPhone()
    const res = await authService.createIdentityWithSession(phone)
    if (res instanceof Error) throw res

    const token = res.sessionToken
    const res2 = await validateKratosToken(token)
    if (res2 instanceof Error) throw res2
    expect(res2.kratosUserId).toBe(res.kratosUserId)
  })

  it("return error on invalid token", async () => {
    const res = await validateKratosToken("invalid_token" as SessionToken)
    expect(res).toBeInstanceOf(AuthenticationKratosError)
  })
})

describe("session revokation", () => {
  const phone = randomPhone()
  it("revoke user session", async () => {
    const res = await authService.createIdentityWithSession(phone)
    if (res instanceof Error) throw res
    const kratosUserId = res.kratosUserId

    {
      const { data } = await kratosAdmin.adminListIdentitySessions(kratosUserId)
      expect(data.length).toBeGreaterThan(0)
    }

    await revokeSessions(kratosUserId)

    {
      const { data } = await kratosAdmin.adminListIdentitySessions(kratosUserId)
      expect(data).toBeFalsy()
    }
  })

  it("return error on revoked session", async () => {
    let token: SessionToken
    {
      const res = await authService.login(phone)
      if (res instanceof Error) throw res
      token = res.sessionToken
      await revokeSessions(res.kratosUserId)
    }
    {
      const res = await validateKratosToken(token)
      expect(res).toBeInstanceOf(AuthenticationKratosError)
    }
  })
})

describe("update status", () => {
  let kratosUserId: KratosUserId
  const phone = randomPhone()

  it("deactivate user", async () => {
    {
      const res = await authService.createIdentityWithSession(phone)
      if (res instanceof Error) throw res
      kratosUserId = res.kratosUserId
    }
    await deactivateUser(kratosUserId)
    const res = await authService.login(phone)
    expect(res).toBeInstanceOf(AuthenticationKratosError)
  })

  it("activate user", async () => {
    await activateUser(kratosUserId)
    const res = await authService.login(phone)
    if (res instanceof Error) throw res
    expect(res.kratosUserId).toBe(kratosUserId)
  })
})

it.skip("list schemas", async () => {
  const res = await listIdentitySchemas()
  if (res instanceof Error) throw res

  const schemasIds = res.map((item) => item.id)

  // what is listed in kratos.yaml#identity.schemas
  expect(schemasIds).toStrictEqual([
    "phone_no_password_v0",
    "phone_with_password_v0",
    "email_and_phone_with_password_v0",
  ])
})

it("extend session", async () => {
  const phone = randomPhone()
  const res = await authService.createIdentityWithSession(phone)
  if (res instanceof Error) throw res

  expect(res).toHaveProperty("kratosUserId")
  const res2 = await kratosPublic.toSession(res.sessionToken)
  const session = res2.data
  if (!session.expires_at) throw Error("should have expired_at")
  const initialExpiresAt = new Date(session.expires_at)

  await extendSession({ session })

  const res3 = await kratosPublic.toSession(res.sessionToken)
  const newSession = res3.data
  if (!newSession.expires_at) throw Error("should have expired_at")
  const newExpiresAt = new Date(newSession.expires_at)

  expect(initialExpiresAt.getTime()).toBeLessThan(newExpiresAt.getTime())
})

describe("upgrade", () => {
  const password = randomPassword()

  it("move from email to email + phone", async () => {
    const phone = randomPhone()
    const email = randomEmail()
    const adminIdentity: AdminCreateIdentityBody = {
      credentials: { password: { config: { password } } },
      state: "active",
      schema_id: "email_and_phone_with_password_v0",
      traits: {
        email,
      },
    }

    const { data: identity } = await kratosAdmin.adminCreateIdentity(adminIdentity)

    const { data: identity2 } = await kratosAdmin.adminUpdateIdentity(identity.id, {
      schema_id: "email_and_phone_with_password_v0",
      state: "active",
      traits: {
        phone,
        email,
      },
    })

    expect(identity.id).toBe(identity2.id)
    expect(identity2.traits).toStrictEqual({
      phone,
      email,
    })
  })
})

describe("decoding link header", () => {
  const withNext =
    '<http://0.0.0.0:4434/identities?page=1&per_page=1>; rel="next",<http://0.0.0.0:4434/identities?page=37&per_page=1>; rel="last"'

  const withoutNext =
    '<http://0.0.0.0:4434/identities?page=0&per_page=1>; rel="first",<http://0.0.0.0:4434/identities?page=46&per_page=1>; rel="prev"'

  it("try decoding link successfully", () => {
    expect(getNextPage(withNext)).toBe(1)
  })

  it("should be undefined when no more next is present", () => {
    expect(getNextPage(withoutNext)).toBe(undefined)
  })
})
