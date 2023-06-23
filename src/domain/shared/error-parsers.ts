import { UnknownDomainError } from "./errors"

export const parseErrorMessageFromUnknown = (error: unknown): string => {
  const errMsg =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : error instanceof Object
      ? JSON.stringify(error)
      : "Unknown error"
  return errMsg
}

export const parseErrorFromUnknown = (error: unknown): Error => {
  const err =
    error instanceof Error
      ? error
      : typeof error === "string"
      ? new Error(error)
      : error instanceof Object
      ? new Error(JSON.stringify(error))
      : new Error("Unknown error")
  return err
}

export const parseUnknownDomainErrorFromUnknown = (error: unknown): DomainError => {
  const err =
    error instanceof Error
      ? error
      : typeof error === "string"
      ? new UnknownDomainError(error)
      : error instanceof Object
      ? new UnknownDomainError(JSON.stringify(error))
      : new UnknownDomainError("Unknown error")
  return err
}
