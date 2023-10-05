import { AuthenticationError } from "@/domain/authentication/errors"
import { ErrorLevel } from "@/domain/shared"

export class KratosError extends AuthenticationError {}

export class MissingSessionIdError extends KratosError {
  level = ErrorLevel.Critical
}

export class AuthenticationKratosError extends KratosError {}
export class ExtendSessionKratosError extends KratosError {}
export class InvalidIdentitySessionKratosError extends KratosError {}

export class SessionRefreshRequiredError extends KratosError {}

export class EmailAlreadyExistsError extends KratosError {}

export class PhoneAccountAlreadyExistsError extends KratosError {
  level = ErrorLevel.Info
}

export class PhoneAccountAlreadyExistsNeedToSweepFundsError extends KratosError {
  level = ErrorLevel.Info
}

export class MissingCreatedAtKratosError extends KratosError {
  level = ErrorLevel.Critical
}

export class MissingExpiredAtKratosError extends KratosError {
  level = ErrorLevel.Critical
}

export class MissingTotpKratosError extends KratosError {
  level = ErrorLevel.Critical
}

export class IncompatibleSchemaUpgradeError extends KratosError {}

export class CodeExpiredKratosError extends KratosError {}

export class UnknownKratosError extends KratosError {
  level = ErrorLevel.Critical
}
