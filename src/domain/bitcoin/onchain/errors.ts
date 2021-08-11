export class OnChainError extends Error {
  name = this.constructor.name
}

export class OnChainServiceError extends OnChainError {}
