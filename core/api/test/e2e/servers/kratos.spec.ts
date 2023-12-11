import { authenticator } from "otplib"

import {
  AuthenticationError,
  EmailCodeInvalidError,
  LikelyNoUserWithThisPhoneExistError,
  LikelyUserAlreadyExistError,
} from "@/domain/authentication/errors"
import {
  AuthWithPhonePasswordlessService,
  AuthWithUsernamePasswordDeviceIdService,
  IdentityRepository,
  extendSession,
  getNextPageToken,
  listSessions,
  validateKratosToken,
  AuthenticationKratosError,
  IncompatibleSchemaUpgradeError,
  KratosError,
  AuthWithEmailPasswordlessService,
  kratosValidateTotp,
  kratosInitiateTotp,
  kratosElevatingSessionWithTotp,
  SchemaIdType,
  kratosRemoveTotp,
} from "@/services/kratos"
import { kratosAdmin, kratosPublic } from "@/services/kratos/private"
import {
  activateUser,
  deactivateUser,
  revokeSessions,
} from "@/services/kratos/tests-but-not-prod"

import { sleep } from "@/utils"

import { getError, randomEmail, randomPhone } from "test/helpers"

import { getEmailCode } from "test/helpers/kratos"

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
    const phone = randomPhone()
    let kratosUserId: UserId

    it("create a user", async () => {
      const res = await authService.createIdentityWithSession({ phone })
      if (res instanceof Error) throw res

      expect(res).toHaveProperty("kratosUserId")
      kratosUserId = res.kratosUserId
    })

    it("can't create user twice", async () => {
      const res = await authService.createIdentityWithSession({ phone })

      expect(res).toBeInstanceOf(LikelyUserAlreadyExistError)
    })

    it("login user succeed if user exists", async () => {
      const res = await authService.loginToken({ phone })
      if (res instanceof Error) throw res

      expect(res.kratosUserId).toBe(kratosUserId)
    })

    it("get user id through getUserIdFromIdentifier(phone)", async () => {
      const identities = IdentityRepository()
      const userId = await identities.getUserIdFromIdentifier(phone)

      if (userId instanceof Error) throw userId

      expect(userId).toBe(kratosUserId)
    })

    it("new sessions are added when LoginWithPhoneNoPasswordSchema is used", async () => {
      const res = await authService.loginToken({ phone })
      if (res instanceof Error) throw res

      expect(res.kratosUserId).toBe(kratosUserId)
      const sessions = await listSessions(kratosUserId)
      if (sessions instanceof Error) throw sessions

      expect(sessions).toHaveLength(3)
    })

    it("add totp", async () => {
      const phone = randomPhone()
      let authToken: AuthToken
      let userId: UserId

      let totpSecret: string
      {
        const res0 = await authService.createIdentityWithSession({ phone })
        if (res0 instanceof Error) throw res0

        authToken = res0.authToken

        const res1 = await kratosInitiateTotp(authToken)
        if (res1 instanceof Error) throw res1

        const { totpSecret: totpSecret_, totpRegistrationId } = res1
        totpSecret = totpSecret_
        const totpCode = authenticator.generate(totpSecret)

        const res = kratosValidateTotp({ totpRegistrationId, totpCode, authToken })
        if (res instanceof Error) throw res

        const res2 = await validateKratosToken(authToken)
        if (res2 instanceof Error) throw res2
        expect(res2).toEqual(
          expect.objectContaining({
            kratosUserId: expect.any(String),
            session: expect.any(Object),
          }),
        )

        // wait for the identity to be updated?
        // some cache or asynchronous method need to run on the kratos side?
        await sleep(100)
        const identity = await IdentityRepository().getIdentity(res2.kratosUserId)
        if (identity instanceof Error) throw identity
        expect(identity.totpEnabled).toBe(true)

        userId = res2.kratosUserId
      }

      {
        const res = await authService.loginToken({ phone })
        if (res instanceof Error) throw res
        expect(res).toEqual(
          expect.objectContaining({
            kratosUserId: undefined,
            authToken: expect.any(String),
          }),
        )

        const totpCode = authenticator.generate(totpSecret) as TotpCode

        const res2 = await kratosElevatingSessionWithTotp({
          authToken: res.authToken,
          totpCode,
        })
        if (res2 instanceof Error) throw res2
        expect(res2).toBe(true)
      }

      await kratosRemoveTotp(userId)

      // wait for the identity to be updated?
      // some cache or asynchronous method need to run on the kratos side?
      await sleep(100)
      const identity = await IdentityRepository().getIdentity(userId)
      if (identity instanceof Error) throw identity
      expect(identity.totpEnabled).toBe(false)
    })

    it("login fails is user doesn't exist", async () => {
      const phone = randomPhone()
      const res = await authService.loginToken({ phone })
      expect(res).toBeInstanceOf(LikelyNoUserWithThisPhoneExistError)
    })

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

  describe("admin api", () => {
    it("create a user with admin api, and can login with self api", async () => {
      const phone = randomPhone()
      const kratosUserId = await authService.createIdentityNoSession({ phone })
      if (kratosUserId instanceof Error) throw kratosUserId

      const res2 = await authService.loginToken({ phone })
      if (res2 instanceof Error) throw res2

      expect(res2.kratosUserId).toBe(kratosUserId)
    })
  })
})

describe("token validation", () => {
  const authService = AuthWithPhonePasswordlessService()

  it("validate bearer token", async () => {
    const phone = randomPhone()
    const res = await authService.createIdentityWithSession({ phone })
    if (res instanceof Error) throw res

    const token = res.authToken
    const res2 = await validateKratosToken(token)
    if (res2 instanceof Error) throw res2
    expect(res2.kratosUserId).toBe(res.kratosUserId)
  })

  it("return error on invalid token", async () => {
    const res = await validateKratosToken("invalid_token" as AuthToken)
    expect(res).toBeInstanceOf(AuthenticationKratosError)
  })
})

describe("session revokation", () => {
  const authService = AuthWithPhonePasswordlessService()

  const phone = randomPhone()
  it("revoke user session", async () => {
    const res = await authService.createIdentityWithSession({ phone })
    if (res instanceof Error) throw res
    const kratosUserId = res.kratosUserId

    {
      const { data } = await kratosAdmin.listIdentitySessions({ id: kratosUserId })
      expect(data.length).toBeGreaterThan(0)
    }

    await revokeSessions(kratosUserId)

    {
      const { data } = await kratosAdmin.listIdentitySessions({ id: kratosUserId })
      expect(data.length).toEqual(0)
    }
  })

  it("return error on revoked session", async () => {
    let token: AuthToken
    {
      const res = await authService.loginToken({ phone })
      if (res instanceof Error) throw res
      if (res.kratosUserId === undefined) throw new Error("kratosUserId is undefined")

      token = res.authToken
      await revokeSessions(res.kratosUserId)
    }
    {
      const res = await validateKratosToken(token)
      expect(res).toBeInstanceOf(AuthenticationKratosError)
    }
  })

  it("revoke a user's second session only", async () => {
    // Session 1
    const session1 = await authService.loginToken({ phone })
    if (session1 instanceof Error) throw session1
    const session1Token = session1.authToken

    // Session 2
    const session2 = await authService.loginToken({ phone })
    if (session2 instanceof Error) throw session2
    const session2Token = session2.authToken

    // Session Details
    //  *caveat, you need to have at least 2 active sessions
    //  for 'listMySessions' to work properly if you only
    //  have 1 active session the data will come back null
    const session1Details = await kratosPublic.listMySessions({
      xSessionToken: session1Token,
    })
    const session1Id = session1Details.data[0].id
    const session2Details = await kratosPublic.listMySessions({
      xSessionToken: session2Token,
    })
    const session2Id = session2Details.data[0].id
    expect(session1Id).toBeDefined()
    expect(session2Id).toBeDefined()

    // Revoke Session 2
    await kratosPublic.performNativeLogout({
      performNativeLogoutBody: {
        session_token: session2Token,
      },
    })

    const isSession1Valid = await validateKratosToken(session1Token)
    const isSession2Valid = await validateKratosToken(session2Token)
    expect(isSession1Valid).toBeDefined()
    expect(isSession2Valid).toBeInstanceOf(KratosError)
  })
})

describe.skip("update status", () => {
  // Status on kratos is not implemented
  const authService = AuthWithPhonePasswordlessService()

  let kratosUserId: UserId
  const phone = randomPhone()

  it("deactivate user", async () => {
    {
      const res = await authService.createIdentityWithSession({ phone })
      if (res instanceof Error) throw res
      kratosUserId = res.kratosUserId
    }
    await deactivateUser(kratosUserId)
    await authService.loginToken({ phone })

    const res = await authService.loginToken({ phone })
    expect(res).toBeInstanceOf(AuthenticationKratosError)
  })

  it("activate user", async () => {
    await activateUser(kratosUserId)
    const res = await authService.loginToken({ phone })
    if (res instanceof Error) throw res
    expect(res.kratosUserId).toBe(kratosUserId)
  })
})

it("extend session", async () => {
  const authService = AuthWithPhonePasswordlessService()

  const phone = randomPhone()
  const res = await authService.createIdentityWithSession({ phone })
  if (res instanceof Error) throw res

  expect(res).toHaveProperty("kratosUserId")
  const res2 = await kratosPublic.toSession({ xSessionToken: res.authToken })
  const sessionKratos = res2.data
  if (!sessionKratos.expires_at) throw Error("should have expired_at")
  const initialExpiresAt = new Date(sessionKratos.expires_at)

  const sessionId = sessionKratos.id as SessionId

  await extendSession(sessionId)
  await sleep(200)
  const res3 = await kratosPublic.toSession({ xSessionToken: res.authToken })
  const newSession = res3.data
  if (!newSession.expires_at) throw Error("should have expired_at")
  const newExpiresAt = new Date(newSession.expires_at)

  expect(initialExpiresAt.getTime()).toBeLessThan(newExpiresAt.getTime())
})

describe("phone+email schema", () => {
  const authServiceEmail = AuthWithEmailPasswordlessService()
  const authServicePhone = AuthWithPhonePasswordlessService()

  let kratosUserId: UserId
  const email = randomEmail()
  const phone = randomPhone()

  it("create a user with phone", async () => {
    const res0 = await authServicePhone.createIdentityWithSession({ phone })
    if (res0 instanceof Error) throw res0
    kratosUserId = res0.kratosUserId

    const newIdentity = await kratosAdmin.getIdentity({ id: kratosUserId })
    expect(newIdentity.data.traits.phone).toBe(phone)

    expect(await authServiceEmail.hasEmail({ kratosUserId })).toBe(false)
  })

  it("upgrade to phone+email schema", async () => {
    const res = await authServiceEmail.addUnverifiedEmailToIdentity({
      kratosUserId,
      email,
    })
    if (res instanceof Error) throw res

    const newIdentity = await kratosAdmin.getIdentity({ id: kratosUserId })
    expect(newIdentity.data.schema_id).toBe("phone_email_no_password_v0")
    expect(newIdentity.data.traits.email).toBe(email)

    expect(await authServiceEmail.hasEmail({ kratosUserId })).toBe(true)
    expect(await authServiceEmail.isEmailVerified({ email })).toBe(false)
  })

  it("get user id through getUserIdFromIdentifier(email)", async () => {
    const identities = IdentityRepository()
    const userId = await identities.getUserIdFromIdentifier(email)

    if (userId instanceof Error) throw userId
    expect(userId).toBe(kratosUserId)
  })

  it("can't add same email to multiple identities", async () => {
    const phone = randomPhone()
    const res0 = await authServicePhone.createIdentityWithSession({ phone })
    if (res0 instanceof Error) throw res0
    const kratosUserId = res0.kratosUserId

    const res = await authServiceEmail.addUnverifiedEmailToIdentity({
      kratosUserId,
      email,
    })
    if (!(res instanceof AuthenticationError)) throw new Error("wrong type")
    expect(res.name).toBe("EmailAlreadyExistsError")
  })

  it("email verification", async () => {
    const emailFlowId = await authServiceEmail.sendEmailWithCode({ email })
    if (emailFlowId instanceof Error) throw emailFlowId

    {
      // TODO: look if there are rate limit on the side of kratos
      const wrongCode = "000000" as EmailCode
      const res = await authServiceEmail.validateCode({
        code: wrongCode,
        emailFlowId,
      })
      expect(res).toBeInstanceOf(EmailCodeInvalidError)

      expect(await authServiceEmail.isEmailVerified({ email })).toBe(false)
    }

    {
      const code = await getEmailCode(email)

      const res = await authServiceEmail.validateCode({
        code,
        emailFlowId,
      })
      if (res instanceof Error) throw res
      expect(res.email).toBe(email)

      expect(await authServiceEmail.isEmailVerified({ email })).toBe(true)
    }
  })

  it("login back to an email account", async () => {
    const emailFlowId = await authServiceEmail.sendEmailWithCode({ email })
    if (emailFlowId instanceof Error) throw emailFlowId

    const code = await getEmailCode(email)

    {
      const wrongCode = "000000" as EmailCode
      const res = await authServiceEmail.validateCode({
        code: wrongCode,
        emailFlowId: emailFlowId,
      })
      expect(res).toBeInstanceOf(EmailCodeInvalidError)
    }

    {
      const res = await authServiceEmail.validateCode({
        code,
        emailFlowId: emailFlowId,
      })
      if (res instanceof Error) throw res
      expect(res.email).toBe(email)
    }

    {
      const res = await authServiceEmail.loginToken({ email })
      if (res instanceof Error) throw res
      expect(res.kratosUserId).toBe(kratosUserId)
    }
  })

  // TODO: verification code expired

  it("login back to an phone+email account by phone", async () => {
    const res = await authServicePhone.loginToken({ phone })
    if (res instanceof Error) throw res

    expect(res.kratosUserId).toBe(kratosUserId)
    const identity = await kratosAdmin.getIdentity({ id: kratosUserId })
    expect(identity.data.schema_id).toBe("phone_email_no_password_v0")
  })

  it("remove email", async () => {
    const res = await authServiceEmail.removeEmailFromIdentity({ kratosUserId })
    if (res instanceof Error) throw res

    const identity = await kratosAdmin.getIdentity({ id: kratosUserId })
    expect(identity.data.schema_id).toBe(SchemaIdType.PhoneNoPasswordV0)
    expect(identity.data.traits.email).toBe(undefined)
  })

  it("can't remove phone if there is no email attached", async () => {
    const res = await authServiceEmail.removePhoneFromIdentity({ kratosUserId })
    expect(res).toBeInstanceOf(IncompatibleSchemaUpgradeError)
  })

  it("remove phone from identity", async () => {
    await authServiceEmail.addUnverifiedEmailToIdentity({
      kratosUserId,
      email,
    })

    const emailRegistrationId = await authServiceEmail.sendEmailWithCode({ email })
    if (emailRegistrationId instanceof Error) throw emailRegistrationId

    {
      const code = await getEmailCode(email)
      await authServiceEmail.validateCode({ code, emailFlowId: emailRegistrationId })
    }

    await authServiceEmail.removePhoneFromIdentity({ kratosUserId })

    const identity = await kratosAdmin.getIdentity({ id: kratosUserId })
    expect(identity.data.schema_id).toBe("email_no_password_v0")
  })

  it("verification on an inexistent email address result in not send an email", async () => {
    const email = randomEmail()

    const flow = await authServiceEmail.sendEmailWithCode({ email })
    if (flow instanceof Error) throw flow

    // there is no email
    await expect(async () => getEmailCode(email)).rejects.toThrow()
  })
})

describe("decoding link header", () => {
  const withNext =
    '</admin/clients?page_size=5&page_token=euKoY1BqY3J8GVax>; rel="first",</admin/clients?page_size=5&page_token=h9LfEKUiFoLH2R0A>; rel="next"'

  const withoutNext =
    '</admin/clients?page_size=5&page_token=euKoY1BqY3J8GVax>; rel="first"'

  it("try decoding link successfully", () => {
    expect(getNextPageToken(withNext)).toBe("h9LfEKUiFoLH2R0A")
  })

  it("should be undefined when no more next is present", () => {
    expect(getNextPageToken(withoutNext)).toBe(undefined)
  })
})

describe("device account flow", () => {
  const authService = AuthWithUsernamePasswordDeviceIdService()
  const username = crypto.randomUUID() as IdentityUsername
  const password = crypto.randomUUID() as IdentityPassword
  let kratosUserId: UserId

  it("create an account", async () => {
    const res = await authService.createIdentityWithSession({
      username,
      password,
    })
    if (res instanceof Error) throw res
    ;({ kratosUserId } = res)

    const newIdentity = await kratosAdmin.getIdentity({ id: kratosUserId })
    expect(newIdentity.data.schema_id).toBe("username_password_deviceid_v0")
    expect(newIdentity.data.traits.username).toBe(username)
  })

  it("upgrade account", async () => {
    const phone = randomPhone()

    const authService = AuthWithPhonePasswordlessService()
    const res = await authService.updateIdentityFromDeviceAccount({
      phone,
      userId: kratosUserId,
    })
    if (res instanceof Error) throw res

    expect(res.phone).toBe(phone)
    expect(res.id).toBe(kratosUserId)
  })
})
