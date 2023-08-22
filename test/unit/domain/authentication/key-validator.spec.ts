import {
  InvalidAuthZHeaderForAuthNError,
  MissingAuthZHeaderForAuthNError,
} from "@domain/authentication/errors"
import { AuthenticationKeyValidator } from "@domain/authentication/key-validator"

const DUMMY_CALLBACK_API_KEY = "dummy-callback-api-key"

describe("AuthenticationKeyValidator", () => {
  const validator = AuthenticationKeyValidator(DUMMY_CALLBACK_API_KEY)

  it("validates valid key", () => {
    const validated = validator.validate(DUMMY_CALLBACK_API_KEY)
    expect(validated).toBe(true)
  })

  it("returns missing key error", () => {
    const validatedEmptyString = validator.validate("")
    expect(validatedEmptyString).toBeInstanceOf(MissingAuthZHeaderForAuthNError)

    const validatedUndefinedString = validator.validate(undefined)
    expect(validatedUndefinedString).toBeInstanceOf(MissingAuthZHeaderForAuthNError)
  })

  it("return invalid key error", () => {
    const rawKey = "invalid-key"
    const validatedEmptyString = validator.validate(rawKey)
    expect(rawKey).not.toBe(DUMMY_CALLBACK_API_KEY)
    expect(validatedEmptyString).toBeInstanceOf(InvalidAuthZHeaderForAuthNError)
  })
})
