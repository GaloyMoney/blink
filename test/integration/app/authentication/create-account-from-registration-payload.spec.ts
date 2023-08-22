import { createAccountFromRegistrationPayload } from "@app/authentication"
import { KRATOS_CALLBACK_API_KEY } from "@config"
import {
  AuthZHeaderForAuthNValidationError,
  RegistrationPayloadValidationError,
} from "@domain/authentication/errors"

describe("createAccountFromRegistrationPayload", () => {
  it("fails with bad auth key", async () => {
    const account = await createAccountFromRegistrationPayload({
      key: "invalid-key",
      body: {},
    })
    expect(account).toBeInstanceOf(AuthZHeaderForAuthNValidationError)
  })

  it("fails with bad registration payload", async () => {
    const account = await createAccountFromRegistrationPayload({
      key: KRATOS_CALLBACK_API_KEY,
      body: {},
    })
    expect(account).toBeInstanceOf(RegistrationPayloadValidationError)
  })
})
