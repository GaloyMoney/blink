export class OnChainError extends Error {
  name = this.constructor.name
}

export class TransactionDecodeError extends OnChainError {}

export class OnChainServiceError extends OnChainError {}
export class UnknownOnChainServiceError extends OnChainServiceError {}
export class OnChainServiceUnavailableError extends OnChainServiceError {}
