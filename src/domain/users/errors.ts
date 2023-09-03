import { AuthorizationError } from "@domain/errors"
import { ValidationError, ErrorLevel } from "@domain/shared"

export class InvalidPhoneMetadataError extends AuthorizationError {}
export class ExpectedPhoneMetadataMissingError extends InvalidPhoneMetadataError {}
export class PhoneMetadataCarrierTypeNotAllowedError extends InvalidPhoneMetadataError {}
export class PhoneCountryNotAllowedError extends InvalidPhoneMetadataError {}

export class InvalidPhoneForOnboardingError extends InvalidPhoneMetadataError {}
export class InvalidPhoneForRewardError extends InvalidPhoneMetadataError {}
export class InvalidPhoneMetadataForOnboardingError extends InvalidPhoneMetadataError {
  level = ErrorLevel.Critical
}

export class PhoneMetadataValidationError extends ValidationError {}
export class InvalidCarrierForPhoneMetadataError extends ValidationError {}
export class InvalidCarrierTypeForPhoneMetadataError extends ValidationError {}
export class InvalidCountryCodeForPhoneMetadataError extends ValidationError {}
