import {
  LikelyNoUserWithThisPhoneExistError,
  LikelyUserAlreadyExistError,
} from "@domain/authentication/errors"
import {
  AuthWithEmailPasswordlessService,
  AuthWithPhonePasswordlessService,
  EmailAlreadyExistsError,
  IdentityRepository,
  listSessions,
} from "@services/kratos"

import { randomEmail, randomPhone } from "test/helpers"

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
    const identities = IdentityRepository()

    it("get user id through getUserIdFromIdentifier(phone)", async () => {
      const { phone, kratosUserId } = await createIdentity()

      const userId = await identities.getUserIdFromIdentifier(phone)
      if (userId instanceof Error) throw userId
      expect(userId).toBe(kratosUserId)
    })
  })
})

describe("phone+email schema", () => {
  const authServiceEmail = AuthWithEmailPasswordlessService()
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
