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

declare const timeoutMSecsSymbol: unique symbol
type TimeoutMSecs = number & { [timeoutMSecsSymbol]: never }

type PaymentStatus =
  typeof import("./index").PaymentStatus[keyof typeof import("./index").PaymentStatus]

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

type PaymentRoute = {
  fee: number
  fee_mtokens: string
  hops: {
    channel: string
    channel_capacity: number
    fee: number
    fee_mtokens: string
    forward: number
    forward_mtokens: string
    public_key?: string
    timeout: number
  }[]
  messages?: {
    type: string
    value: string
  }[]
  mtokens: string
  timeout: number
  tokens: number
}

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
  readonly routeHint: PaymentRequestRoutes
  readonly payment?
  readonly cltvDelta?
  readonly features: PaymentRequestFeatures
}

type PaymentResult = {
  safe_fee: Satoshis
  paymentSecret: PaymentSecret
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
    request,
  }: {
    request: EncodedPaymentRequest
  }): DecodedPaymentRequest | LightningServiceError
  payRequest({
    decodedRequest,
    timeoutMSecs,
  }: {
    decodedRequest: DecodedPaymentRequest
    timeoutMSecs?: TimeoutMSecs
  }): Promise<PaymentResult | LightningServiceError>
  payToRoute({
    route,
    id,
    timeoutMSecs,
  }: {
    route: PaymentRoute
    id: Pubkey
    timeoutMSecs?: TimeoutMSecs
  }): Promise<PaymentResult | LightningServiceError>
}
