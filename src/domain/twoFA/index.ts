import { authenticator } from "otplib"

import { TwoFAValidationError, UnknownTwoFAError } from "./errors"

export * from "./errors"

export const TwoFA = (): TwoFA => {
  const generate = (): {
    secret: TwoFASecret
  } => {
    const result = authenticator.generateSecret()
    return {
      secret: result as TwoFASecret,
      // uri: result.uri as TwoFAUri,
    }
  }

  const verify = ({
    secret,
    token,
  }: {
    secret: TwoFASecret
    token: TwoFAToken
  }): true | TwoFAError => {
    try {
      const result = authenticator.verify({ token, secret })
      if (!result) {
        return new TwoFAValidationError()
      }
      return true
    } catch (err) {
      return new UnknownTwoFAError()
    }
  }
  return {
    verify,
    generate,
  }
}
