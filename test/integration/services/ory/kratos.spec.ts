import {
  LikelyNoUserWithThisPhoneExistError,
  LikelyUserAlreadyExistError,
} from "@domain/users/errors"
import {
  createKratosUserForPhoneNoPasswordSchema,
  loginForPhoneNoPasswordSchema,
  upgradeUserToPasswordSchema,
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
