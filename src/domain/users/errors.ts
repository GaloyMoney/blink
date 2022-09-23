import { DomainError, ErrorLevel } from "@domain/shared"

export class KratosError extends DomainError {}
export class LikelyNoUserWithThisPhoneExistError extends KratosError {}
export class LikelyUserAlreadyExistError extends KratosError {}

export class IncompatibleSchemaUpgradeError extends KratosError {
  level = ErrorLevel.Critical
}

export class UnknownKratosError extends KratosError {
  level = ErrorLevel.Critical
}
