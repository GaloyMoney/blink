import { DomainError, ErrorLevel } from "@domain/errors"

export class PhoneProviderServiceError extends DomainError {}

export class InvalidPhoneNumberPhoneProviderError extends PhoneProviderServiceError {}
export class RestrictedRegionPhoneProviderError extends PhoneProviderServiceError {}
export class UnknownPhoneProviderServiceError extends PhoneProviderServiceError {
  level = ErrorLevel.Critical
}
