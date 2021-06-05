import { ApolloError } from 'apollo-server-errors';

export class CustomError extends ApolloError {
  log
  forwardToClient

  constructor(message, code, {forwardToClient, logger, level, metadata}) {
    super(message, code, {metadata})
    this.log = logger[level].bind(logger)
    this.forwardToClient = forwardToClient
  }
}

export class TransactionRestrictedError extends CustomError {
  constructor(message, {forwardToClient, logger, level, ...metadata}) {
    super(message, 'TRANSACTION_RESTRICTED', {forwardToClient, logger, level, metadata})
  }
}

export class InsufficientBalanceError extends CustomError {
  constructor(message, {forwardToClient, logger, level, ...metadata}) {
    super(message, 'INSUFFICIENT_BALANCE', {forwardToClient, logger, level, metadata})
  }
}

export class SelfPaymentError extends CustomError {
  constructor(message, {forwardToClient, logger, level, ...metadata}) {
    super(message, 'CANT_PAY_SELF', {forwardToClient, logger, level, metadata})
  }
}

export class ValidationError extends CustomError {
  constructor(message, {forwardToClient, logger, level, ...metadata}) {
    super(message, 'INVALID_INPUT', {forwardToClient, logger, level, metadata})
  }
}

export class NotFoundError extends CustomError {
  constructor(message, {forwardToClient, logger, level, ...metadata}) {
    super(message, 'NOT_FOUND', {forwardToClient, logger, level, metadata})
  }
}

export class NewAccountWithdrawalError extends CustomError {
  constructor(message, {forwardToClient, logger, level, ...metadata}) {
    super(message, 'NEW_ACCOUNT_WITHDRAWAL_RESTRICTED', {forwardToClient, logger, level, metadata})
  }
}

export class TooManyRequestError extends CustomError {
  constructor({forwardToClient = true, logger, level = 'warn', ...metadata}) {
    const message = 'Too many requests'
    super(message, 'TOO_MANY_REQUEST', {forwardToClient, logger, level, metadata})
  }
}

export class DbError extends CustomError {
  constructor(message, {forwardToClient, logger, level, ...metadata}) {
    super(message, 'DB_ERROR', {forwardToClient, logger, level, metadata})
  }
}

export class LightningPaymentError extends CustomError {
  constructor(message, {forwardToClient, logger, level, ...metadata}) {
    super(message, 'LIGHTNING_PAYMENT_ERROR', {forwardToClient, logger, level, metadata})
  }
}

export class RouteFindingError extends CustomError {
  constructor(message, {forwardToClient = true, logger, level = 'warn', ...metadata}) {
    super(message, 'ROUTE_FINDING_ERROR', {forwardToClient, logger, level, metadata})
  }
}

export class RebalanceNeededError extends CustomError {
  constructor(message, {forwardToClient = false, logger, level = 'fatal', ...metadata}) {
    super(message, 'REBALANCE_NEEDED', {forwardToClient, logger, level, metadata})
  }
}