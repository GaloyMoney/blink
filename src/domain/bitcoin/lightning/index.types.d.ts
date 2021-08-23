type LightningError = import("./errors").LightningError
type LnInvoiceDecodeError = import("./errors").LnInvoiceDecodeError
type LightningServiceError = import("./errors").LightningServiceError

declare const invoiceExpirationSymbol: unique symbol
type InvoiceExpiration = Date & { [invoiceExpirationSymbol]: never }

declare const encodedPaymentRequestSymbol: unique symbol
type EncodedPaymentRequest = string & { [encodedPaymentRequestSymbol]: never }

declare const paymentHashSymbol: unique symbol
type PaymentHash = string & { [paymentHashSymbol]: never }

declare const paymentSecretSymbol: unique symbol
type PaymentSecret = string & { [paymentSecretSymbol]: never }

type LnInvoice = {
  readonly paymentHash: PaymentHash
  readonly paymentSecret: PaymentSecret
  readonly paymentRequest: EncodedPaymentRequest
}

// Type directly from 'lightning' library
type PaymentRequestRoutes = {
  base_fee_mtokens?: string | undefined
  channel?: string | undefined
  cltv_delta?: number | undefined
  fee_rate?: number | undefined
  public_key: string
}[][]

type PaymentRequestFeatures = {
  bit: number
  is_known: boolean
  is_required: boolean
  type: string
}[]

type DecodedPaymentRequest = {
  readonly id: PaymentHash
  readonly satoshis: Satoshis
  readonly destination: Pubkey
  readonly description: string
  readonly routeHint: PaymentRequestRoutes
  readonly payment?
  readonly cltvDelta?
  readonly expiresAt: InvoiceExpiration
  readonly features: PaymentRequestFeatures
}

type RegisterInvoiceArgs = {
  description: string
  satoshis: Satoshis
  expiresAt: InvoiceExpiration
}

type RegisteredInvoice = {
  invoice: LnInvoice
  pubkey: Pubkey
}

interface ILightningService {
  registerInvoice(
    registerInvoiceArgs: RegisterInvoiceArgs,
  ): Promise<RegisteredInvoice | LightningServiceError>
  decodeRequest({
    request: EncodedPaymentRequest,
  }): DecodedPaymentRequest | LightningServiceError
}
