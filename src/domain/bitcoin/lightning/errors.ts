import { DomainError, ErrorLevel } from "@domain/errors"

export class LightningError extends DomainError {}

export class LnInvoiceDecodeError extends LightningError {}
export class LnInvoiceMissingPaymentSecretError extends LnInvoiceDecodeError {}
export class UnknownLnInvoiceDecodeError extends LnInvoiceDecodeError {
  level = ErrorLevel.Critical
}

export class LightningServiceError extends LightningError {}
export class CouldNotDecodeReturnedPaymentRequest extends LightningServiceError {}
export class UnknownLightningServiceError extends LightningServiceError {
  level = ErrorLevel.Critical
}
export class InvoiceNotFoundError extends LightningServiceError {}
export class LnPaymentPendingError extends LightningServiceError {}
export class LnAlreadyPaidError extends LightningServiceError {}
export class NoValidNodeForPubkeyError extends LightningServiceError {}
export class PaymentNotFoundError extends LightningServiceError {}
export class RouteNotFoundError extends LightningServiceError {}
export class InsufficientBalanceForRoutingError extends LightningServiceError {}
export class InvoiceExpiredOrBadPaymentHashError extends LightningServiceError {}
export class UnknownRouteNotFoundError extends LightningServiceError {
  level = ErrorLevel.Critical
}
export class BadPaymentDataError extends LightningServiceError {}
export class CorruptLndDbError extends LightningServiceError {}
