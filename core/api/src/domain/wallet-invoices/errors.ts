import { ValidationError, ErrorLevel, DomainError } from "@/domain/shared"

export class SubOneCentSatAmountForUsdReceiveError extends ValidationError {}
export class InvalidWalletInvoiceBuilderStateError extends ValidationError {
  level = ErrorLevel.Critical
}

export class WalletInvoiceMissingPaymentRequestError extends DomainError {}
