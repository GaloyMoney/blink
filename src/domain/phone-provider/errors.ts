export class PhoneProviderServiceError extends Error {
  name = this.constructor.name
}

export class UnknownPhoneProviderServiceError extends PhoneProviderServiceError {}
