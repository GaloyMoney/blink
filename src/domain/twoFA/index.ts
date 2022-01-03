import { verifyToken } from "node-2fa"

import { TwoFAValidationError, UnknownTwoFAError } from "./errors"

export * from "./errors"

export const TwoFA = (): TwoFA => {
  const verify = ({
    secret,
    token,
  }: {
    secret: TwoFASecret
    token: TwoFAToken
  }): true | TwoFAError => {
    try {
      const result = verifyToken(secret, token)
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
  }
}
