import { DomainError, ErrorLevel } from "@domain/shared"

export class BriaEventError extends DomainError {}

export class UnknownBriaEventError extends BriaEventError {
  level = ErrorLevel.Critical
}
