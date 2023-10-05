import { createAccountFromRegistrationPayload } from "@/app/authentication"
import { KRATOS_CALLBACK_API_KEY } from "@/config"
import {
  SecretForAuthNCallbackError,
  RegistrationPayloadValidationError,
} from "@/domain/authentication/errors"

describe("createAccountFromRegistrationPayload", () => {
  it("fails with bad auth key", async () => {
    const account = await createAccountFromRegistrationPayload({
      secret: "invalid-key",
      body: {},
    })
    expect(account).toBeInstanceOf(SecretForAuthNCallbackError)
  })

  it("fails with bad registration payload", async () => {
    const account = await createAccountFromRegistrationPayload({
      secret: KRATOS_CALLBACK_API_KEY,
      body: {},
    })
    expect(account).toBeInstanceOf(RegistrationPayloadValidationError)
  })
})
