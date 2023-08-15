import { DomainError, ErrorLevel } from "@domain/shared"

export class SvixEventError extends DomainError {}

export class UnknownSvixError extends SvixEventError {
  level = ErrorLevel.Critical
}
