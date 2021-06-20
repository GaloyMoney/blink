import { ApolloError } from 'apollo-server-errors';
import { yamlConfig } from './config';
import { baseLogger } from "./logger";

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
  constructor(message, {forwardToClient = true, logger, level = 'warn', ...metadata}) {
    super(message, 'TRANSACTION_RESTRICTED', {forwardToClient, logger, level, metadata})
  }
}

export class InsufficientBalanceError extends CustomError {
  constructor(message = `balance is too low`, {forwardToClient = true, logger, level = 'warn', ...metadata}) {
    super(message, 'INSUFFICIENT_BALANCE', {forwardToClient, logger, level, metadata})
  }
}

export class SelfPaymentError extends CustomError {
  constructor(message = 'User tried to pay themselves', {forwardToClient = true, logger, level = 'warn', ...metadata}) {
    super(message, 'CANT_PAY_SELF', {forwardToClient, logger, level, metadata})
  }
}

export class ValidationError extends CustomError {
  constructor(message, {forwardToClient = true, logger, level = 'warn', ...metadata}) {
    super(message, 'INVALID_INPUT', {forwardToClient, logger, level, metadata})
  }
}

export class NotFoundError extends CustomError {
  constructor(message, {forwardToClient = true, logger, level= 'warn', ...metadata}) {
    super(message, 'NOT_FOUND', {forwardToClient, logger, level, metadata})
  }
}

export class NewAccountWithdrawalError extends CustomError {
  constructor(message, {forwardToClient = true, logger, level = 'warn', ...metadata}) {
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
  constructor(message, {forwardToClient = true, logger, level, ...metadata}) {
    super(message, 'DB_ERROR', {forwardToClient, logger, level, metadata})
  }
}

export class LightningPaymentError extends CustomError {
  constructor(message, {forwardToClient = true, logger, level = 'warn', ...metadata}) {
    super(message, 'LIGHTNING_PAYMENT_ERROR', {forwardToClient, logger, level, metadata})
  }
}

export class RouteFindingError extends CustomError {
  constructor(message = 'Unable to find a route for payment', {forwardToClient = true, logger, level = 'warn', ...metadata}) {
    super(message, 'ROUTE_FINDING_ERROR', {forwardToClient, logger, level, metadata})
  }
}

export class RebalanceNeededError extends CustomError {
  constructor(message = `Insufficient onchain balance on lnd`, {forwardToClient = false, logger, level = 'fatal', ...metadata}) {
    super(message, 'REBALANCE_NEEDED', {forwardToClient, logger, level, metadata})
  }
}

export class DustAmountError extends CustomError {
  constructor(message = `Use lightning to send amounts less than ${yamlConfig.onchainDustAmount}`, {forwardToClient = true, logger, level = 'warn', ...metadata}) {
    super(message, 'ENTERED_DUST_AMOUNT', {forwardToClient, logger, level, metadata})
  }
}

export class LndOfflineError extends CustomError {
  constructor(message, {forwardToClient = true, logger = baseLogger, level = 'warn', ...metadata} = {}) {
    super(message, 'LND_OFFLINE', {forwardToClient, logger, level, metadata})
  }
}

export class AuthorizationError extends CustomError {
  constructor(message = `Not authorized!`, {forwardToClient = true, logger, level = 'warn', ...metadata}) {
    super(message, 'NOT_AUTHORIZED', {forwardToClient, logger, level, metadata})
  }
}
