export class LightningError extends Error {
  name = this.constructor.name
}

export class LnInvoiceDecodeError extends LightningError {}
export class LnInvoiceMissingPaymentSecretError extends LnInvoiceDecodeError {}
export class UnknownLnInvoiceDecodeError extends LnInvoiceDecodeError {}

export class LightningServiceError extends LightningError {}
export class CouldNotDecodeReturnedPaymentRequest extends LightningServiceError {}
export class UnknownLightningServiceError extends LightningServiceError {}
export class InvoiceNotFoundError extends LightningServiceError {}
export class LnPaymentPendingError extends LightningServiceError {}
export class LnAlreadyPaidError extends LightningServiceError {}
export class NoValidNodeForPubkeyError extends LightningServiceError {}
export class PaymentNotFoundError extends LightningServiceError {}
export class RouteNotFoundError extends LightningServiceError {}
