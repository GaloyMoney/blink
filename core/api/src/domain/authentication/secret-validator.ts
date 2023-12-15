import {
  InvalidSecretForAuthNCallbackError,
  MissingSecretForAuthNCallbackError,
} from "./errors"

export const CallbackSecretValidator = (
  internalCallbackApiSecret: string,
): CallbackSecretValidator => {
  const authorize = (secret: string | undefined): true | ValidationError => {
    switch (true) {
      case !secret:
        return new MissingSecretForAuthNCallbackError()

      case secret !== internalCallbackApiSecret:
        return new InvalidSecretForAuthNCallbackError()

      default:
        return true
    }
  }

  return {
    authorize,
  }
}
