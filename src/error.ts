import { ApolloError } from 'apollo-server-errors';

export class CustomError extends ApolloError {
  log
  forwardToClient

  constructor(message, code, {forwardToClient, logger, level}) {
    super(message, code)
    this.log = logger[level].bind(logger)
    this.forwardToClient = forwardToClient
  }
}

export class TransactionRestrictedError extends CustomError {
  constructor(message, {forwardToClient, logger, level}) {
    super(message, 'TRANSACTION_RESTRICTED', {forwardToClient, logger, level})
  }
}

export class InsufficientBalanceError extends CustomError {
  constructor(message, {forwardToClient, logger, level}) {
    super(message, 'INSUFFICIENT_BALANCE', {forwardToClient, logger, level})
  }
}

export class SelfPaymentError extends CustomError {
  constructor(message, {forwardToClient, logger, level}) {
    super(message, 'CANT_PAY_SELF', {forwardToClient, logger, level})
  }
}

export class ValidationError extends CustomError {
  constructor(message, {forwardToClient, logger, level}) {
    super(message, 'INVALID_INPUT', {forwardToClient, logger, level})
  }
}

export class NotFoundError extends CustomError {
  constructor(message, {forwardToClient, logger, level}) {
    super(message, 'NOT_FOUND', {forwardToClient, logger, level})
  }
}

export class NewAccountWithdrawalError extends CustomError {
  constructor(message, {forwardToClient, logger, level}) {
    super(message, 'NEW_ACCOUNT_WITHDRAWAL_RESTRICTED', {forwardToClient, logger, level})
  }
}

export class DbError extends CustomError {
  constructor(message, {forwardToClient, logger, level}) {
    super(message, 'DB_ERROR', {forwardToClient, logger, level})
  }
}