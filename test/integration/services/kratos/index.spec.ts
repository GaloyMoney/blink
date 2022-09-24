import {
  AuthenticationKratosError,
  LikelyNoUserWithThisPhoneExistError,
  LikelyUserAlreadyExistError,
} from "@domain/users/errors"
import {
  activateUser,
  createKratosUserForPhoneNoPasswordSchema,
  deactivateUser,
  kratosAdmin,
  loginForPhoneNoPasswordSchema,
  revokeSessions,
  upgradeUserToPasswordSchema,
  validateKratosToken,
} from "@services/kratos"

let kratosUserId: KratosUserId = "37d6452a-565d-41dd-aaf0-d1ea8fd12b76" as KratosUserId

describe("kratos", () => {
  it("create a user", async () => {
    const phone = "123456" as PhoneNumber
    const res = await createKratosUserForPhoneNoPasswordSchema(phone)
    if (res instanceof Error) throw res

    expect(res).toHaveProperty("kratosUserId")
    kratosUserId = res.kratosUserId
  })

  it("can't create user twice", async () => {
    const phone = "123456" as PhoneNumber
    const res = await createKratosUserForPhoneNoPasswordSchema(phone)

    expect(res).toBeInstanceOf(LikelyUserAlreadyExistError)
  })

  it("login user succeed is user exists", async () => {
    const phone = "123456" as PhoneNumber
    const res = await loginForPhoneNoPasswordSchema(phone)
    if (res instanceof Error) throw res

    expect(res.kratosUserId).toBe(kratosUserId)
  })

  it("validate bearer token", async () => {
    const phone = "123456" as PhoneNumber
    const res = await loginForPhoneNoPasswordSchema(phone)
    if (res instanceof Error) throw res

    const token = res.sessionToken
    const res2 = await validateKratosToken(token)
    expect(res2).toBe(res.kratosUserId)
  })

  it("return error on invalid token", async () => {
    const res = await validateKratosToken("invalid_token" as KratosSessionToken)
    expect(res).toBeInstanceOf(AuthenticationKratosError)
  })

  it("revokeUserSession", async () => {
    const phone = "123456" as PhoneNumber
    const res = await loginForPhoneNoPasswordSchema(phone)
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
    const phone = "123456" as PhoneNumber
    let token: KratosSessionToken
    {
      const res = await loginForPhoneNoPasswordSchema(phone)
      if (res instanceof Error) throw res
      token = res.sessionToken
      await revokeSessions(res.kratosUserId)
    }
    {
      const res = await validateKratosToken(token)
      expect(res).toBeInstanceOf(AuthenticationKratosError)
    }
  })

  describe("update status", () => {
    let kratosUserId: KratosUserId

    it("deactivate user", async () => {
      const phone = "12345678" as PhoneNumber
      {
        const res = await createKratosUserForPhoneNoPasswordSchema(phone)
        if (res instanceof Error) throw res
        kratosUserId = res.kratosUserId
      }
      await deactivateUser(kratosUserId)
      const res = await loginForPhoneNoPasswordSchema(phone)
      expect(res).toBeInstanceOf(AuthenticationKratosError)
    })

    it("activate user", async () => {
      const phone = "12345678" as PhoneNumber

      await activateUser(kratosUserId)
      const res = await loginForPhoneNoPasswordSchema(phone)
      if (res instanceof Error) throw res
      expect(res.kratosUserId).toBe(kratosUserId)
    })
  })

  it("login fails is user doesn't exist", async () => {
    const phone = "1234567" as PhoneNumber
    const res = await loginForPhoneNoPasswordSchema(phone)
    expect(res).toBeInstanceOf(LikelyNoUserWithThisPhoneExistError)
  })

  it("change user from passwordless to password", async () => {
    const password = "hardToFindWithNumber321_AndRandomSignLike$_"
    const res = await upgradeUserToPasswordSchema({ kratosUserId, password })
    if (res instanceof Error) throw res
    expect(res.schema_id).toBe("phone_with_password_v0")
  })

  // TODO:
  // use hooks to make login on self service with phone number not available
})
