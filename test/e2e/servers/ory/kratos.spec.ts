import { getKratosPasswords } from "@config"
import {
  LikelyNoUserWithThisPhoneExistError,
  LikelyUserAlreadyExistError,
} from "@domain/authentication/errors"
import { CreateIdentityBody } from "@ory/client"
import {
  AuthWithPhonePasswordlessService,
  IdentityRepository,
  extendSession,
  getNextPage,
  listSessions,
  validateKratosToken,
} from "@services/kratos"
import { AuthenticationKratosError, KratosError } from "@services/kratos/errors"
import { kratosAdmin, kratosPublic } from "@services/kratos/private"
import {
  activateUser,
  addTotp,
  deactivateUser,
  elevatingSessionWithTotp,
  listIdentitySchemas,
  revokeSessions,
} from "@services/kratos/tests-but-not-prod"
import { authenticator } from "otplib"

import { AuthWithEmailPasswordlessService } from "@services/kratos/auth-email-no-password"

import { PhoneCodeInvalidError } from "@domain/phone-provider"

import USER_UPDATE_PHONE from "../../../e2e/servers/graphql-main-server/mutations/user-update-phone.gql"
import ACCOUNT_DETAILS_BY_USER_PHONE from "../../../e2e/servers/graphql-main-server/queries/account-details-by-user-phone.gql"

import {
  adminTestClientConfig,
  createApolloClient,
  defaultTestClientConfig,
  fundWalletIdFromLightning,
  getAdminPhoneAndCode,
  getDefaultWalletIdByTestUserRef,
  getError,
  getPhoneAndCodeFromRef,
  killServer,
  randomEmail,
  randomPassword,
  randomPhone,
  startServer,
} from "test/helpers"
import { getEmailCode } from "test/helpers/kratos"
import { UserLoginDocument } from "test/e2e/generated"

const identityRepo = IdentityRepository()

let serverPid: PID

beforeAll(async () => {
  // await removeIdentities()

  // needed for the kratos callback to registration
  serverPid = await startServer("start-main-ci")
})

afterAll(async () => {
  await killServer(serverPid)
})

describe("phoneNoPassword", () => {
  const authService = AuthWithPhonePasswordlessService()

  describe("public selflogin api", () => {
    const phone = randomPhone()
    let kratosUserId: UserId

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
      const res = await authService.loginToken(phone)
      if (res instanceof Error) throw res

      expect(res.kratosUserId).toBe(kratosUserId)
    })

    it("new sessions are added when LoginWithPhoneNoPasswordSchema is used", async () => {
      const res = await authService.loginToken(phone)
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
        expect(res2).toEqual(
          expect.objectContaining({
            kratosUserId: expect.any(String),
            session: expect.any(Object),
          }),
        )
      }

      // FIXME: tmp for test.
      // NB: I don't think it make sense to have 2fa for passwordless schema
      // but the test is still useful to know how to use kratos for 2fa
      {
        const password = getKratosPasswords().masterUserPassword

        const res = await authService.loginToken(phone)
        if (res instanceof Error) throw res
        expect(res).toEqual(
          expect.objectContaining({
            kratosUserId: expect.any(String),
            sessionToken: expect.any(String),
          }),
        )

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
      const res = await authService.loginToken(phone)
      expect(res).toBeInstanceOf(LikelyNoUserWithThisPhoneExistError)
    })

    it("can get the user with slowFindByPhone", async () => {
      const identity = await identityRepo.slowFindByPhone(phone)
      if (identity instanceof Error) throw identity

      expect(identity.phone).toBe(phone)
    })

    it("forbidding change of a phone number from publicApi", async () => {
      const phone = randomPhone()

      const res = await authService.createIdentityWithSession(phone)
      if (res instanceof Error) throw res

      const res1 = await validateKratosToken(res.sessionToken)
      if (res1 instanceof Error) throw res1
      expect(res1.session.identity.phone).toStrictEqual(phone)

      const res2 = await kratosPublic.createNativeSettingsFlow({
        xSessionToken: res.sessionToken,
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
          xSessionToken: res.sessionToken,
        }),
      )

      expect(err).toBeTruthy()
    })
  })

  describe("admin api", () => {
    it("create a user with admin api, and can login with self api", async () => {
      const phone = randomPhone()
      const kratosUserId = await authService.createIdentityNoSession(phone)
      if (kratosUserId instanceof Error) throw kratosUserId

      const res2 = await authService.loginToken(phone)
      if (res2 instanceof Error) throw res2

      expect(res2.kratosUserId).toBe(kratosUserId)
    })
  })
})

it("list users", async () => {
  const res = await identityRepo.listIdentities()
  if (res instanceof Error) throw res
  expect(Array.isArray(res)).toBe(true)
})

describe("token validation", () => {
  const authService = AuthWithPhonePasswordlessService()

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
  const authService = AuthWithPhonePasswordlessService()

  const phone = randomPhone()
  it("revoke user session", async () => {
    const res = await authService.createIdentityWithSession(phone)
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
    let token: SessionToken
    {
      const res = await authService.loginToken(phone)
      if (res instanceof Error) throw res
      token = res.sessionToken
      await revokeSessions(res.kratosUserId)
    }
    {
      const res = await validateKratosToken(token)
      expect(res).toBeInstanceOf(AuthenticationKratosError)
    }
  })

  it("revoke a user's second session only", async () => {
    // Session 1
    const session1 = await authService.loginToken(phone)
    if (session1 instanceof Error) throw session1
    const session1Token = session1.sessionToken

    // Session 2
    const session2 = await authService.loginToken(phone)
    if (session2 instanceof Error) throw session2
    const session2Token = session2.sessionToken

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
      const res = await authService.createIdentityWithSession(phone)
      if (res instanceof Error) throw res
      kratosUserId = res.kratosUserId
    }
    await deactivateUser(kratosUserId)
    await authService.loginToken(phone)

    const res = await authService.loginToken(phone)
    expect(res).toBeInstanceOf(AuthenticationKratosError)
  })

  it("activate user", async () => {
    await activateUser(kratosUserId)
    const res = await authService.loginToken(phone)
    if (res instanceof Error) throw res
    expect(res.kratosUserId).toBe(kratosUserId)
  })
})

// FIXME: not sure why this one is failing on github actions
it.skip("list schemas", async () => {
  const res = await listIdentitySchemas()
  if (res instanceof Error) throw res

  const schemasIds = res.map((item) => item.id)

  // what is listed in kratos.yaml#identity.schemas
  expect(schemasIds).toStrictEqual([
    "phone_no_password_v0",
    "phone_email_no_password_v0",
    "phone_or_email_password_v0",
  ])
})

it("extend session", async () => {
  const authService = AuthWithPhonePasswordlessService()

  const phone = randomPhone()
  const res = await authService.createIdentityWithSession(phone)
  if (res instanceof Error) throw res

  expect(res).toHaveProperty("kratosUserId")
  const res2 = await kratosPublic.toSession({ xSessionToken: res.sessionToken })
  const session = res2.data
  if (!session.expires_at) throw Error("should have expired_at")
  const initialExpiresAt = new Date(session.expires_at)

  await extendSession({ session })

  const res3 = await kratosPublic.toSession({ xSessionToken: res.sessionToken })
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
    const adminIdentity: CreateIdentityBody = {
      credentials: { password: { config: { password } } },
      state: "active",
      schema_id: "phone_email_no_password_v0",
      traits: {
        email,
      },
    }

    const { data: identity } = await kratosAdmin.createIdentity({
      createIdentityBody: adminIdentity,
    })

    const { data: identity2 } = await kratosAdmin.updateIdentity({
      id: identity.id,
      updateIdentityBody: {
        schema_id: "phone_email_no_password_v0",
        state: "active",
        traits: {
          phone,
          email,
        },
      },
    })

    expect(identity.id).toBe(identity2.id)
    expect(identity2.traits).toStrictEqual({
      phone,
      email,
    })
  })
})

describe("phone+email schema", () => {
  const authServiceEmail = AuthWithEmailPasswordlessService()
  const authServicePhone = AuthWithPhonePasswordlessService()

  let kratosUserId: UserId
  const email = randomEmail()
  const phone = randomPhone()

  it("create a user", async () => {
    const res0 = await authServicePhone.createIdentityWithSession(phone)
    if (res0 instanceof Error) throw res0
    kratosUserId = res0.kratosUserId

    const res = await authServicePhone.upgradeToPhoneAndEmailSchema({
      kratosUserId,
      email,
    })
    if (res instanceof Error) throw res

    const newIdentity = await kratosAdmin.getIdentity({ id: kratosUserId })
    expect(newIdentity.data.schema_id).toBe("phone_email_no_password_v0")
    expect(newIdentity.data.traits.email).toBe(email)
    expect(newIdentity.data.verifiable_addresses?.[0].verified).toBe(false)
  })

  it("verification for phone + email schema", async () => {
    const flow = await authServiceEmail.initiateEmailVerification(email)
    if (flow instanceof Error) throw flow

    {
      const identity = await kratosAdmin.getIdentity({ id: kratosUserId })
      expect(identity.data.verifiable_addresses?.[0].verified).toBe(false)
    }

    {
      const wrongCode = "000000"
      const res = await authServiceEmail.validateEmailVerification({
        code: wrongCode,
        flow,
      })
      expect(res).toBeInstanceOf(PhoneCodeInvalidError)
    }

    {
      const code = await getEmailCode({ email })

      // TODO: verification code expired
      const res = await authServiceEmail.validateEmailVerification({ code, flow })
      expect(res).toBe(true)

      const identity = await kratosAdmin.getIdentity({ id: kratosUserId })
      expect(identity.data.verifiable_addresses?.[0].verified).toBe(true)
    }
  })

  it("login back to an phone+email account by email", async () => {
    const flow = await authServiceEmail.initiateEmailVerification(email)
    if (flow instanceof Error) throw flow

    const code = await getEmailCode({ email })

    {
      const wrongCode = "000000"
      const res = await authServiceEmail.validateEmailVerification({
        code: wrongCode,
        flow,
      })
      expect(res).toBeInstanceOf(PhoneCodeInvalidError)
    }

    {
      const res = await authServiceEmail.validateEmailVerification({ code, flow })
      expect(res).toBe(true)
    }

    {
      const res = await authServiceEmail.login(email)
      if (res instanceof Error) throw res
      expect(res.kratosUserId).toBe(kratosUserId)
    }

    // TODO: verification code expired
  })

  it("login back to an phone+email account by phone", async () => {
    const res = await authServicePhone.loginToken(phone)
    if (res instanceof Error) throw res

    expect(res.kratosUserId).toBe(kratosUserId)
    const identity = await kratosAdmin.getIdentity({ id: kratosUserId })
    expect(identity.data.schema_id).toBe("phone_email_no_password_v0")
  })
})

describe("decoding link header", () => {
  const withNext =
    '<http://0.0.0.0:4434/identities?page=1&page_size=1&page_token=eyJvZmZzZXQiOiIxIiwidiI6Mn0&per_page=1>; rel="next",<http://0.0.0.0:4434/identities?page=1&page_size=1&page_token=eyJvZmZzZXQiOiIxIiwidiI6Mn0&per_page=1>; rel="last"'

  const withoutNext =
    '<http://0.0.0.0:4434/identities?page=0&page_size=1&page_token=eyJvZmZzZXQiOiIwIiwidiI6Mn0&per_page=1>; rel="first",<http://0.0.0.0:4434/identities?page=0&page_size=1&page_token=eyJvZmZzZXQiOiIwIiwidiI6Mn0&per_page=1>; rel="prev"'

  it("try decoding link successfully", () => {
    expect(getNextPage(withNext)).toBe(1)
  })

  it("should be undefined when no more next is present", () => {
    expect(getNextPage(withoutNext)).toBe(undefined)
  })
})

describe("updates user phone", () => {
  let newPhone: PhoneNumber

  it("updates user phone", async () => {
    const { phone, code } = getPhoneAndCodeFromRef("H")

    const { apolloClient, disposeClient } = createApolloClient(defaultTestClientConfig())

    await apolloClient.mutate({
      mutation: UserLoginDocument,
      variables: { input: { phone, code } },
    })

    const { phone: adminPhone, code: adminCode } = await getAdminPhoneAndCode()

    const loginResult = await apolloClient.mutate({
      mutation: UserLoginDocument,
      variables: { input: { phone: adminPhone, code: adminCode } },
    })

    await disposeClient()

    const { apolloClient: adminApolloClient, disposeClient: disposeAdminClient } =
      await createApolloClient(
        adminTestClientConfig(loginResult.data.userLogin.authToken),
      )

    const accountDetails = await adminApolloClient.query({
      query: ACCOUNT_DETAILS_BY_USER_PHONE,
      variables: { phone },
    })

    const uid = accountDetails.data.accountDetailsByUserPhone.id

    newPhone = randomPhone()
    await adminApolloClient.mutate({
      mutation: USER_UPDATE_PHONE,
      variables: { input: { phone: newPhone, uid } },
    })

    const result = await adminApolloClient.query({
      query: ACCOUNT_DETAILS_BY_USER_PHONE,
      variables: { phone: newPhone },
    })

    await disposeAdminClient()

    expect(result.data.accountDetailsByUserPhone.id).toBe(uid)
  })

  it("updates phone even if new phone is associated with a zero balance account, but not otherwise", async () => {
    const { apolloClient, disposeClient } = createApolloClient(defaultTestClientConfig())
    const { phone, code } = getPhoneAndCodeFromRef("I")
    const walletId = await getDefaultWalletIdByTestUserRef("I")

    apolloClient.mutate({
      mutation: UserLoginDocument,
      variables: { input: { phone, code } },
    })

    const { phone: adminPhone, code: adminCode } = await getAdminPhoneAndCode()

    const loginResult = await apolloClient.mutate({
      mutation: UserLoginDocument,
      variables: { input: { phone: adminPhone, code: adminCode } },
    })

    disposeClient()

    const { apolloClient: adminApolloClient, disposeClient: disposeAdminClient } =
      createApolloClient(adminTestClientConfig(loginResult.data.userLogin.authToken))

    const accountDetails = await adminApolloClient.query({
      query: ACCOUNT_DETAILS_BY_USER_PHONE,
      variables: { phone },
    })

    const uid = accountDetails.data.accountDetailsByUserPhone.id

    const result = await adminApolloClient.mutate({
      mutation: USER_UPDATE_PHONE,
      variables: { input: { phone: newPhone, uid } },
    })

    // removes the phone from a user with zero balance
    expect(result.data.userUpdatePhone.errors.length).toBe(0)

    await fundWalletIdFromLightning({ walletId, amount: 1000 })

    const result1 = await adminApolloClient.mutate({
      mutation: USER_UPDATE_PHONE,
      variables: { input: { phone: newPhone, uid } },
    })

    // errors when trying to remove phone from a user with non zero balance
    expect(result1.data.userUpdatePhone.errors[0].message).toContain(
      "The phone is associated with an existing wallet that has a non zero balance",
    )

    await disposeAdminClient()
  })
})

describe("cookie flow", () => {
  it("login with cookie then revoke session", async () => {
    const authService = AuthWithPhonePasswordlessService()
    const phone = randomPhone()

    const res = (await authService.createIdentityWithCookie(phone)) as WithCookieResponse
    expect(res).toHaveProperty("kratosUserId")
    expect(res).toHaveProperty("cookiesToSendBackToClient")

    const cookies: Array<SessionCookie> = res.cookiesToSendBackToClient
    let cookieStr = ""
    for (const cookie of cookies) {
      cookieStr = cookieStr + cookie + "; "
    }
    cookieStr = decodeURIComponent(cookieStr)

    const kratosSession = await kratosPublic.toSession({ cookie: cookieStr })
    const sessionId = kratosSession.data.id
    const kratosResp = await kratosAdmin.disableSession({
      id: sessionId,
    })
    expect(kratosResp.status).toBe(204)
  })
})
