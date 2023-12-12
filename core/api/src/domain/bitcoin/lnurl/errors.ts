import { DomainError, ErrorLevel } from "@/domain/shared"

export class LnurlError extends DomainError {}
export class ErrorFetchingLnurlInvoice extends LnurlError {}
export class UnknownLnurlError extends LnurlError {
  level = ErrorLevel.Critical
}
