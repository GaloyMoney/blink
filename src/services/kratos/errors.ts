import { AuthenticationError } from "@domain/authentication/errors"
import { ErrorLevel } from "@domain/shared"

export class KratosError extends AuthenticationError {}
export class AuthenticationKratosError extends KratosError {}

export class MissingExpiredAtKratosError extends KratosError {
  level = ErrorLevel.Critical
}

export class MissingTotpKratosError extends KratosError {
  level = ErrorLevel.Critical
}

export class IncompatibleSchemaUpgradeError extends KratosError {
  level = ErrorLevel.Critical
}

export class UnknownKratosError extends KratosError {
  level = ErrorLevel.Critical
}
