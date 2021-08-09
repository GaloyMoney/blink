class CoreError extends Error {
  name = this.constructor.name
}

export class LnInvoiceDecodeError extends CoreError {}

export class LnInvoiceLookupError extends CoreError {}

export class LightningServiceError extends CoreError {}
export class CouldNotDecodeReturnedPaymentRequest extends LightningServiceError {}
export class UnknownLightningServiceError extends LightningServiceError {}
