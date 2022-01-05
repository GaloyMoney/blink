export class PhoneProviderServiceError extends Error {
  name = this.constructor.name
}

export class InvalidPhoneNumberPhoneProviderError extends PhoneProviderServiceError {}
export class UnknownPhoneProviderServiceError extends PhoneProviderServiceError {}
