import { generateSecret, verifyToken } from "node-2fa"

import { TwoFAValidationError, UnknownTwoFAError } from "./errors"

export * from "./errors"

export const TwoFA = (): TwoFA => {
  const generate = ({
    galoyInstanceName,
    phone,
  }: {
    galoyInstanceName: string
    phone: PhoneNumber
  }): {
    secret: TwoFASecret
    uri: TwoFAUri
  } => {
    const result = generateSecret({
      name: galoyInstanceName,
      account: phone,
    })
    return {
      secret: result.secret as TwoFASecret,
      uri: result.uri as TwoFAUri,
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
    generate,
  }
}
