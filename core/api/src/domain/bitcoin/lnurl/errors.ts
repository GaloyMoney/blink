import { DomainError } from "@/domain/shared"

export class LnurlError extends DomainError {}

export class ErrorFetchingLnurlInvoice extends LnurlError {}
