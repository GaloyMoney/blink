export class ColdStorageError extends Error {
  name = this.constructor.name
}

export class ColdStorageServiceError extends ColdStorageError {}
export class InvalidCurrentColdStorageWalletServiceError extends ColdStorageServiceError {}
export class InsufficientBalanceForRebalanceError extends ColdStorageServiceError {}
export class UnknownColdStorageServiceError extends ColdStorageServiceError {}
