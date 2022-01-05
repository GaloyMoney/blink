export class TwoFAError extends Error {
  name = this.constructor.name
}

export class TwoFAValidationError extends TwoFAError {}
export class TwoFAAlreadySetError extends TwoFAError {}
export class TwoFANewCodeNeededError extends TwoFAError {}
export class UnknownTwoFAError extends TwoFAError {}
export class TwoFANeedToBeSetBeforeDeletionError extends TwoFAError {}
