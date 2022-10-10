import { DomainError, ErrorLevel } from "@domain/shared"

export class KratosError extends DomainError {}
export class LikelyNoUserWithThisPhoneExistError extends KratosError {}
export class LikelyUserAlreadyExistError extends KratosError {}
export class AuthenticationKratosError extends KratosError {}
export class MissingTotpKratosError extends KratosError {
  level = ErrorLevel.Critical
}

export class IncompatibleSchemaUpgradeError extends KratosError {
  level = ErrorLevel.Critical
}

export class UnknownKratosError extends KratosError {
  level = ErrorLevel.Critical
}
