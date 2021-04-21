import { ApolloError } from 'apollo-server-errors';

export class CustomError extends ApolloError {
  log
  forwardToClient

  constructor(message, code, {forwardToClient, log}) {
    super(message, code)
    this.log = log
    this.forwardToClient = forwardToClient
  }
}

export class TransactionRestrictedError extends CustomError {
  constructor(message, {forwardToClient, log}) {
    super(message, 'TRANSACTION_RESTRICTED', {forwardToClient, log})
  }
}

export class InsufficientBalanceError extends CustomError {
  constructor(message, {forwardToClient, log}) {
    super(message, 'INSUFFICIENT_BALANCE', {forwardToClient, log})
  }
}

export class ValidationError extends CustomError {
  constructor(message, {forwardToClient, log}) {
    super(message, 'INVALID_INPUT', {forwardToClient, log})
  }
}