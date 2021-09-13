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

declare const featureBitSymbol: unique symbol
type FeatureBit = number & { [featureBitSymbol]: never }

declare const featureTypeSymbol: unique symbol
type FeatureType = string & { [featureTypeSymbol]: never }

type PaymentStatus =
  typeof import("./index").PaymentStatus[keyof typeof import("./index").PaymentStatus]

type PaymentSendStatus =
  typeof import("./index").PaymentSendStatus[keyof typeof import("./index").PaymentSendStatus]

type Hop = {
  baseFeeMTokens?: string
  channel?: string
  cltvDelta?: number
  feeRate?: number
  nodePubkey: Pubkey
}

type LnInvoiceFeature = {
  // BOLT 09 Feature Bit Number
  bit: FeatureBit
  // Feature Support is Required To Pay Bool
  isRequired: boolean
  // Feature Type String
  type: FeatureType
}

type LnInvoiceLookup = {
  readonly isSettled: boolean
  readonly description: string
  readonly received: Satoshis
}

type LnPaymentLookup = {
  readonly status: PaymentStatus
  readonly roundedUpFee: Satoshis
  readonly milliSatsAmount: MilliSatoshis
}

type LnInvoice = {
  readonly destination: Pubkey
  readonly paymentHash: PaymentHash
  readonly paymentRequest: EncodedPaymentRequest
  readonly milliSatsAmount: MilliSatoshis
  readonly description: string
  readonly cltvDelta: number | null
  readonly amount: Satoshis | null
  readonly routeHints: Hop[][]
  readonly paymentSecret: PaymentSecret | null
  readonly features: LnInvoiceFeature[]
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

type LnFeeCalculator = {
  max(amount: Satoshis): Satoshis
}

type PayInvoiceResult = {
  roundedUpFee: Satoshis
}

interface ILightningService {
  lndFromPubkey(pubkey: Pubkey): AuthenticatedLnd | LightningServiceError

  isLocal(pubkey: Pubkey): boolean | LightningServiceError

  registerInvoice(
    registerInvoiceArgs: RegisterInvoiceArgs,
  ): Promise<RegisteredInvoice | LightningServiceError>

  lookupInvoice({
    pubkey,
    paymentHash,
  }: {
    pubkey: Pubkey
    paymentHash: PaymentHash
  }): Promise<LnInvoiceLookup | LightningServiceError>

  lookupPayment({
    pubkey,
    paymentHash,
  }: {
    pubkey: Pubkey
    paymentHash: PaymentHash
  }): Promise<LnPaymentLookup | LightningServiceError>

  payInvoice({
    paymentHash,
    route,
    lndAuthForRoute,
    decodedInvoice,
    maxFee,
    timeoutMs,
  }: {
    paymentHash: PaymentHash
    route: CachedRoute | null
    lndAuthForRoute: AuthenticatedLnd | null
    decodedInvoice: LnInvoice
    milliSatsAmount: MilliSatoshis
    maxFee: Satoshis
    timeoutMs?: MilliSeconds
  }): Promise<PayInvoiceResult | LightningServiceError>

  deleteUnpaidInvoice({
    pubkey,
    paymentHash,
  }: {
    pubkey: Pubkey
    paymentHash: PaymentHash
  }): Promise<void | LightningServiceError>
}
