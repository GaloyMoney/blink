import { TwoFAValidationError, UnknownTwoFAError } from "./errors"
import { verifyToken } from "node-2fa"

export * from "./errors"

export const TwoFA = (): TwoFAComponent => {
  const verify = ({
    secret,
    token,
  }: {
    secret: TwoFASecret
    token: TwoFAToken
  }): void | TwoFAError => {
    try {
      const result = verifyToken(secret, token)
      if (!result) {
        return new TwoFAValidationError()
      }
    } catch (err) {
      return new UnknownTwoFAError()
    }
  }
  return {
    verify,
  }
}
