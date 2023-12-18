import { DomainError, ErrorLevel } from "@/domain/shared"

export class LnurlServiceError extends DomainError {}
export class ErrorFetchingLnurlInvoice extends LnurlServiceError {}
export class UnknownLnurlServiceError extends LnurlServiceError {
  level = ErrorLevel.Critical
}
