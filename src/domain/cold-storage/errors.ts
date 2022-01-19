export class ColdStorageError extends Error {
  name = this.constructor.name
}

export class ColdStorageServiceError extends ColdStorageError {}
export class UnknownColdStorageServiceError extends ColdStorageServiceError {}
