import { DomainError, ErrorLevel } from "@domain/shared"

export class LedgerFacadeError extends DomainError {}
export class NoTransactionToSettleError extends LedgerFacadeError {}
export class UnknownLedgerError extends LedgerFacadeError {
  level = ErrorLevel.Critical
}
