import {
  InvalidAuthZHeaderForAuthNError,
  MissingAuthZHeaderForAuthNError,
} from "./errors"

export const AuthenticationKeyValidator = (
  internal_callback_api_key: string,
): AuthenticationKeyValidator => {
  const validate = (rawKey: string | undefined): true | ValidationError => {
    switch (true) {
      case !rawKey:
        return new MissingAuthZHeaderForAuthNError()

      case rawKey !== internal_callback_api_key:
        return new InvalidAuthZHeaderForAuthNError()

      default:
        return true
    }
  }

  return {
    validate,
  }
}
