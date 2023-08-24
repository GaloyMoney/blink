import {
  EmailCodeInvalidError,
  EmailUnverifiedError,
  LikelyNoUserWithThisPhoneExistError,
  LikelyUserAlreadyExistError,
} from "@domain/authentication/errors"
import {
  AuthWithEmailPasswordlessService,
  AuthWithPhonePasswordlessService,
  AuthWithUsernamePasswordDeviceIdService,
  EmailAlreadyExistsError,
  IdentityRepository,
  IncompatibleSchemaUpgradeError,
  SchemaIdType,
  listSessions,
} from "@services/kratos"

import { randomEmail, randomPassword, randomPhone, randomUsername } from "test/helpers"
import { getEmailCode } from "test/helpers/kratos"

const createIdentity = async () => {
  const phone = randomPhone()
  const created = await AuthWithPhonePasswordlessService().createIdentityWithSession({
    phone,
  })
  if (created instanceof Error) throw created
  return { phone, kratosUserId: created.kratosUserId }
}

describe("phoneNoPassword schema", () => {
  const authService = AuthWithPhonePasswordlessService()
  const identities = IdentityRepository()

  describe("public selflogin api", () => {
    describe("user", () => {
      it("creates a user", async () => {
        const phone = randomPhone()
        const res = await authService.createIdentityWithSession({ phone })
        if (res instanceof Error) throw res
        expect(res).toHaveProperty("kratosUserId")

        const resRetryCreate = await authService.createIdentityWithSession({ phone })
        expect(resRetryCreate).toBeInstanceOf(LikelyUserAlreadyExistError)
      })

      it("logs user in if exists", async () => {
        const { phone, kratosUserId } = await createIdentity()

        const res = await authService.loginToken({ phone })
        if (res instanceof Error) throw res
        expect(res.kratosUserId).toBe(kratosUserId)

        const identity = await identities.getIdentity(kratosUserId)
        if (identity instanceof Error) throw identity
        expect(identity.schema).toBe(SchemaIdType.PhoneNoPasswordV0)
      })

      it("fails to log user in if doesn't exist", async () => {
        const phone = randomPhone()
        const res = await authService.loginToken({ phone })
        expect(res).toBeInstanceOf(LikelyNoUserWithThisPhoneExistError)
      })
    })

    describe("user sessions", () => {
      it("adds a new session for a new login", async () => {
        const { phone, kratosUserId } = await createIdentity()

        const startingSessions = await listSessions(kratosUserId)
        if (startingSessions instanceof Error) throw startingSessions

        await authService.loginToken({ phone })

        const sessions = await listSessions(kratosUserId)
        if (sessions instanceof Error) throw sessions
        expect(sessions.length - startingSessions.length).toEqual(1)
      })
    })
  })

  describe("IdentityRepository", () => {
    it("gets user id from phone", async () => {
      const { phone, kratosUserId } = await createIdentity()

      const userId = await identities.getUserIdFromIdentifier(phone)
      if (userId instanceof Error) throw userId
      expect(userId).toBe(kratosUserId)
    })
  })
})

describe("phone+email schema", () => {
  const authServiceEmail = AuthWithEmailPasswordlessService()
  const authServicePhone = AuthWithPhonePasswordlessService()
  const identities = IdentityRepository()

  describe("user", () => {
    it("creates a user with phone", async () => {
      const { phone, kratosUserId } = await createIdentity()

      const identity = await identities.getIdentity(kratosUserId)
      if (identity instanceof Error) throw identity
      expect(identity.phone).toBe(phone)
      expect(identity.email).toBeUndefined()

      expect(await authServiceEmail.hasEmail({ kratosUserId })).toBe(false)
    })

    it("upgrades to phone+email schema", async () => {
      const { kratosUserId } = await createIdentity()

      const email = randomEmail()
      const res = await authServiceEmail.addUnverifiedEmailToIdentity({
        kratosUserId,
        email,
      })
      if (res instanceof Error) throw res

      const identity = await identities.getIdentity(kratosUserId)
      if (identity instanceof Error) throw identity
      expect(identity.schema).toBe("phone_email_no_password_v0")
      expect(identity.email).toBe(email)

      expect(await authServiceEmail.hasEmail({ kratosUserId })).toBe(true)
      expect(await authServiceEmail.isEmailVerified({ email })).toBe(false)
    })

    it("can't add same email to multiple identities", async () => {
      const { kratosUserId } = await createIdentity()
      const email = randomEmail()
      await authServiceEmail.addUnverifiedEmailToIdentity({
        kratosUserId,
        email,
      })

      const { kratosUserId: newkratosUserId } = await createIdentity()
      const res = await authServiceEmail.addUnverifiedEmailToIdentity({
        kratosUserId: newkratosUserId,
        email,
      })
      expect(res).toBeInstanceOf(EmailAlreadyExistsError)
    })

    it("verifies email for identity", async () => {
      const { kratosUserId } = await createIdentity()
      const email = randomEmail()
      await authServiceEmail.addUnverifiedEmailToIdentity({
        kratosUserId,
        email,
      })

      const emailFlowId = await authServiceEmail.sendEmailWithCode({ email })
      if (emailFlowId instanceof Error) throw emailFlowId

      // TODO: look if there are rate limit on the side of kratos
      const wrongCode = "000000" as EmailCode
      let res = await authServiceEmail.validateCode({
        code: wrongCode,
        emailFlowId,
      })
      expect(res).toBeInstanceOf(EmailCodeInvalidError)
      expect(await authServiceEmail.isEmailVerified({ email })).toBe(false)

      const code = await getEmailCode(email)
      res = await authServiceEmail.validateCode({
        code,
        emailFlowId,
      })
      if (res instanceof Error) throw res
      expect(res.email).toBe(email)
      expect(await authServiceEmail.isEmailVerified({ email })).toBe(true)
    })

    it("fails to verify non-existent email", async () => {
      const email = randomEmail()
      const flow = await authServiceEmail.sendEmailWithCode({ email })
      if (flow instanceof Error) throw flow

      await expect(async () => getEmailCode(email)).rejects.toThrow()
    })

    it("gets login token using unverified email", async () => {
      const { kratosUserId } = await createIdentity()
      const email = randomEmail()
      await authServiceEmail.addUnverifiedEmailToIdentity({
        kratosUserId,
        email,
      })

      const res = await authServiceEmail.loginToken({ email })
      if (res instanceof Error) throw res
      expect(res.kratosUserId).toBe(kratosUserId)
      expect(res.authToken).toBeTruthy()
    })

    it("gets login cookie using unverified email", async () => {
      const { kratosUserId } = await createIdentity()
      const email = randomEmail()
      await authServiceEmail.addUnverifiedEmailToIdentity({
        kratosUserId,
        email,
      })

      const res = await authServiceEmail.loginCookie({ email })
      if (res instanceof Error) throw res
      expect(res.kratosUserId).toBe(kratosUserId)
      expect(res.cookiesToSendBackToClient.length).toBe(2)
    })

    it("gets login token & correct schema using phone", async () => {
      const { phone, kratosUserId } = await createIdentity()
      const email = randomEmail()
      await authServiceEmail.addUnverifiedEmailToIdentity({
        kratosUserId,
        email,
      })

      const res = await authServicePhone.loginToken({ phone })
      if (res instanceof Error) throw res
      expect(res.kratosUserId).toBe(kratosUserId)
      expect(res.authToken).toBeTruthy()

      const identity = await identities.getIdentity(kratosUserId)
      if (identity instanceof Error) throw identity
      expect(identity.schema).toBe(SchemaIdType.PhoneEmailNoPasswordV0)
    })

    it("removes email from identity", async () => {
      const { kratosUserId } = await createIdentity()
      const email = randomEmail()
      await authServiceEmail.addUnverifiedEmailToIdentity({
        kratosUserId,
        email,
      })

      const res = await authServiceEmail.removeEmailFromIdentity({ kratosUserId })
      if (res instanceof Error) throw res

      const identity = await identities.getIdentity(kratosUserId)
      if (identity instanceof Error) throw identity
      expect(identity.schema).toBe(SchemaIdType.PhoneNoPasswordV0)
    })

    it("fails to remove phone if no email attached", async () => {
      const { kratosUserId } = await createIdentity()
      const res = await authServiceEmail.removePhoneFromIdentity({ kratosUserId })
      expect(res).toBeInstanceOf(IncompatibleSchemaUpgradeError)
    })

    it("removes phone from identity with verified email", async () => {
      const { kratosUserId } = await createIdentity()
      const email = randomEmail()
      await authServiceEmail.addUnverifiedEmailToIdentity({
        kratosUserId,
        email,
      })

      const emailFlowId = await authServiceEmail.sendEmailWithCode({ email })
      if (emailFlowId instanceof Error) throw emailFlowId
      const code = await getEmailCode(email)
      const validated = await authServiceEmail.validateCode({
        code,
        emailFlowId,
      })
      if (validated instanceof Error) throw validated

      const res = await authServiceEmail.removePhoneFromIdentity({ kratosUserId })
      expect(res).not.toBeInstanceOf(Error)

      const identity = await identities.getIdentity(kratosUserId)
      if (identity instanceof Error) throw identity
      expect(identity.schema).toBe(SchemaIdType.EmailNoPasswordV0)
    })

    it("fails to remove phone with unverified email", async () => {
      const { kratosUserId } = await createIdentity()
      const email = randomEmail()
      await authServiceEmail.addUnverifiedEmailToIdentity({
        kratosUserId,
        email,
      })

      const res = await authServiceEmail.removePhoneFromIdentity({ kratosUserId })
      expect(res).toBeInstanceOf(EmailUnverifiedError)
    })
  })

  describe("IdentityRepository", () => {
    it("gets userId via email", async () => {
      const { kratosUserId } = await createIdentity()

      const email = randomEmail()
      const res = await authServiceEmail.addUnverifiedEmailToIdentity({
        kratosUserId,
        email,
      })
      if (res instanceof Error) throw res

      const userId = await identities.getUserIdFromIdentifier(email)
      if (userId instanceof Error) throw userId
      expect(userId).toBe(kratosUserId)
    })
  })
})

describe("username+password schema (device account)", () => {
  const authServiceUsername = AuthWithUsernamePasswordDeviceIdService()
  const authServicePhone = AuthWithPhonePasswordlessService()
  const identities = IdentityRepository()

  it("create an account", async () => {
    const username = randomUsername()
    const password = randomPassword()

    const res = await authServiceUsername.createIdentityWithSession({
      username,
      password,
    })
    if (res instanceof Error) throw res
    const { kratosUserId } = res

    const newIdentity = await identities.getIdentity(kratosUserId)
    if (newIdentity instanceof Error) throw newIdentity
    expect(newIdentity.schema).toBe(SchemaIdType.UsernamePasswordDeviceIdV0)
    expect(newIdentity.username).toBe(username)
  })

  it("upgrade account", async () => {
    const username = randomUsername()
    const password = randomPassword()
    const usernameResult = await authServiceUsername.createIdentityWithSession({
      username,
      password,
    })
    if (usernameResult instanceof Error) throw usernameResult
    const { kratosUserId } = usernameResult

    const phone = randomPhone()
    const res = await authServicePhone.updateIdentityFromDeviceAccount({
      phone,
      userId: kratosUserId,
    })
    if (res instanceof Error) throw res

    expect(res.phone).toBe(phone)
    expect(res.id).toBe(kratosUserId)
  })
})
