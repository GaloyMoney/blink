export class OnChainError extends Error {
  name = this.constructor.name
}

export class TransactionDecodeError extends OnChainError {}
export class UnknownOnChainServiceError extends OnChainError {}
export class OnChainServiceUnavailableError extends OnChainError {}
