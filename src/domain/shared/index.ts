import { ErrorLevel } from "./errors"

export * from "./primitives"
export * from "./calculator"
export * from "./safe"
export * from "./errors"

export const setErrorWarn = (error: DomainError): DomainError => {
  error.level = ErrorLevel.Warn
  return error
}

export const setErrorCritical = (error: DomainError): DomainError => {
  error.level = ErrorLevel.Critical
  return error
}
