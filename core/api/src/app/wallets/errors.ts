import { DomainError, ErrorLevel } from "@/domain/shared"

export class InvoiceProcessingError extends DomainError {}
export class InvalidInvoiceProcessingStateError extends InvoiceProcessingError {
  level = ErrorLevel.Critical
}
