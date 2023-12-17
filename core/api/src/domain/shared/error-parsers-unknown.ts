import { UnknownDomainError } from "./errors"

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
