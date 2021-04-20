import { ApolloError } from 'apollo-server-errors';

export class CustomError extends ApolloError {
  logger
  forwardToClient

  constructor(message, code, forwardToClient, logger) {
    super(message, code)
    this.logger = logger
    this.forwardToClient = forwardToClient
  }
}

export class TransactionRestrictedError extends CustomError {
  constructor(message, forwardToClient, logger) {
    super(message, 'TRANSACTION_RESTRICTED', forwardToClient, logger)
  }
}

export class InsufficientBalanceError extends CustomError {
  constructor(message, forwardToClient, logger) {
    super(message, 'INSUFFICIENT_BALANCE', forwardToClient, logger)
  }
}

export class ValidationError extends CustomError {
  constructor(message, forwardToClient, logger) {
    super(message, 'INVALID_INPUT', forwardToClient, logger)
  }
}