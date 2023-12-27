import { DomainError, ErrorLevel } from "@/domain/shared"

export class PhoneProviderServiceError extends DomainError {}

export class ExpiredOrNonExistentPhoneNumberError extends PhoneProviderServiceError {}
export class PhoneProviderRateLimitExceededError extends PhoneProviderServiceError {}
export class InvalidPhoneNumberPhoneProviderError extends PhoneProviderServiceError {}
export class InvalidTypePhoneProviderError extends PhoneProviderServiceError {}
export class RestrictedRegionPhoneProviderError extends PhoneProviderServiceError {}
export class UnsubscribedRecipientPhoneProviderError extends PhoneProviderServiceError {}
export class RestrictedRecipientPhoneNumberError extends PhoneProviderServiceError {}
export class InvalidOrApprovedVerificationError extends PhoneProviderServiceError {}
export class MissingTypePhoneProviderError extends PhoneProviderServiceError {
  level = ErrorLevel.Critical
}

export class PhoneCodeInvalidError extends PhoneProviderServiceError {}

export class PhoneProviderConnectionError extends PhoneProviderServiceError {
  level = ErrorLevel.Warn
}
export class PhoneProviderUnavailableError extends PhoneProviderServiceError {
  level = ErrorLevel.Critical
}
export class UnknownPhoneProviderServiceError extends PhoneProviderServiceError {
  level = ErrorLevel.Critical
}
