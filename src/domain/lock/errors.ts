export class LockError extends Error {
  name = this.constructor.name
}

export class LockServiceError extends LockError {}
export class UnknownLockServiceError extends LockServiceError {}
