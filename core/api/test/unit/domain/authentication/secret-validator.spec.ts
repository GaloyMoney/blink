import {
  InvalidSecretForAuthNCallbackError,
  MissingSecretForAuthNCallbackError,
} from "@/domain/authentication/errors"
import { CallbackSecretValidator } from "@/domain/authentication/secret-validator"

const DUMMY_CALLBACK_API_KEY = "dummy-callback-api-key"

describe("CallbackSecretValidator", () => {
  const validator = CallbackSecretValidator(DUMMY_CALLBACK_API_KEY)

  it("validates valid key", () => {
    const validated = validator.authorize(DUMMY_CALLBACK_API_KEY)
    expect(validated).toBe(true)
  })

  it("returns missing key error", () => {
    const validatedEmptyString = validator.authorize("")
    expect(validatedEmptyString).toBeInstanceOf(MissingSecretForAuthNCallbackError)

    const validatedUndefinedString = validator.authorize(undefined)
    expect(validatedUndefinedString).toBeInstanceOf(MissingSecretForAuthNCallbackError)
  })

  it("return invalid key error", () => {
    const rawKey = "invalid-key"
    const validatedEmptyString = validator.authorize(rawKey)
    expect(rawKey).not.toBe(DUMMY_CALLBACK_API_KEY)
    expect(validatedEmptyString).toBeInstanceOf(InvalidSecretForAuthNCallbackError)
  })
})
