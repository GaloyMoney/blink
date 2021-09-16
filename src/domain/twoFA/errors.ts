export class TwoFAError extends Error {
  name = this.constructor.name
}

export class TwoFAValidationError extends TwoFAError {}
export class UnknownTwoFAError extends TwoFAError {}
