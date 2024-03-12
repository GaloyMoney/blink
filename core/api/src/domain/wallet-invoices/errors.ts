import { ValidationError, ErrorLevel } from "@/domain/shared"

export class SubOneCentSatAmountForUsdReceiveError extends ValidationError {}
export class InvoiceNotPaidError extends ValidationError {}
export class InvoiceAlreadyProcessedError extends ValidationError {}
export class InvalidWalletInvoiceBuilderStateError extends ValidationError {
  level = ErrorLevel.Critical
}
