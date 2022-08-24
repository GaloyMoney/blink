export * from "./primitives"
export * from "./calculator"
export * from "./safe"
export * from "./errors"

export const ErrorLevel = {
  Info: "info",
  Warn: "warn",
  Critical: "critical",
} as const

export const RankedErrorLevel = [ErrorLevel.Info, ErrorLevel.Warn, ErrorLevel.Critical]

export const setErrorWarn = (error: DomainError): DomainError => {
  error.level = ErrorLevel.Warn
  return error
}

export const setErrorCritical = (error: DomainError): DomainError => {
  error.level = ErrorLevel.Critical
  return error
}
