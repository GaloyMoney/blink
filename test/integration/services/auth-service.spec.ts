import {
  LikelyNoUserWithThisPhoneExistError,
  LikelyUserAlreadyExistError,
} from "@domain/authentication/errors"
import {
  AuthWithPhonePasswordlessService,
  IdentityRepository,
  listSessions,
} from "@services/kratos"

import { randomPhone } from "test/helpers"

describe("phoneNoPassword", () => {
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
        const phone = randomPhone()
        const created = await authService.createIdentityWithSession({ phone })
        if (created instanceof Error) throw created
        const { kratosUserId } = created

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
        const phone = randomPhone()
        const created = await authService.createIdentityWithSession({ phone })
        if (created instanceof Error) throw created
        const { kratosUserId } = created

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
      const phone = randomPhone()
      const created = await authService.createIdentityWithSession({ phone })
      if (created instanceof Error) throw created
      const { kratosUserId } = created

      const userId = await identities.getUserIdFromIdentifier(phone)
      if (userId instanceof Error) throw userId
      expect(userId).toBe(kratosUserId)
    })
  })
})
