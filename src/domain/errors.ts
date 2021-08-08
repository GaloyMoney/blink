class CoreError extends Error {
  name = this.constructor.name
}

export class LnInvoiceDecodeError extends CoreError {}

export class LnInvoiceLookupError extends CoreError {}
