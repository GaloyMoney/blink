import { AuthorizationError } from "@/domain/errors"
import { ValidationError, ErrorLevel } from "@/domain/shared"

export class UnauthorizedPhoneError extends AuthorizationError {}
export class ExpectedPhoneMetadataMissingError extends UnauthorizedPhoneError {}
export class PhoneCarrierTypeNotAllowedError extends UnauthorizedPhoneError {}
export class PhoneCountryNotAllowedError extends UnauthorizedPhoneError {}

export class InvalidPhoneForOnboardingError extends UnauthorizedPhoneError {}
export class InvalidPhoneForQuizError extends UnauthorizedPhoneError {}
export class InvalidPhoneMetadataForOnboardingError extends UnauthorizedPhoneError {
  level = ErrorLevel.Critical
}

export class PhoneMetadataValidationError extends ValidationError {}
export class InvalidCarrierForPhoneMetadataError extends ValidationError {
  level = ErrorLevel.Critical
}
export class InvalidCarrierTypeForPhoneMetadataError extends ValidationError {
  level = ErrorLevel.Critical
}
export class InvalidErrorCodeForPhoneMetadataError extends ValidationError {
  level = ErrorLevel.Critical
}
export class InvalidCountryCodeForPhoneMetadataError extends ValidationError {
  level = ErrorLevel.Critical
}
