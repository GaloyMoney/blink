import {
  InvalidAuthZHeaderForAuthNError,
  MissingAuthZHeaderForAuthNError,
} from "./errors"

export const AuthenticationKeyValidator = (
  internal_callback_api_key: string,
): AuthenticationKeyValidator => {
  const validate = (rawKey: string | undefined): true | ValidationError => {
    let errMsg = ""
    switch (true) {
      case !rawKey:
        errMsg = "missing authorization header"
        return new MissingAuthZHeaderForAuthNError(errMsg)

      case rawKey !== internal_callback_api_key:
        errMsg = "incorrect authorization header"
        return new InvalidAuthZHeaderForAuthNError(errMsg)

      default:
        return true
    }
  }

  return {
    validate,
  }
}
