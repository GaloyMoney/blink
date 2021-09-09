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
  readonly createdAt: Date
  readonly confirmedAt: Date | undefined
  readonly amount: Satoshis
  readonly secret: PaymentSecret
  readonly request: string | undefined
  readonly destination: Pubkey
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
  isLocal(pubkey: Pubkey): boolean | LightningServiceError

  lndFromPubkey(pubkey: Pubkey): AuthenticatedLnd | LightningServiceError

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

  cancelInvoice({
    pubkey,
    paymentHash,
  }: {
    pubkey: Pubkey
    paymentHash: PaymentHash
  }): Promise<void | LightningServiceError>

  payInvoice({
    paymentHash,
    rawRoute,
    lndAuthForRoute,
    decodedInvoice,
    maxFee,
  }: {
    paymentHash: PaymentHash
    rawRoute: RawRoute | null
    lndAuthForRoute: AuthenticatedLnd | null
    decodedInvoice: LnInvoice
    milliSatsAmount: MilliSatoshis
    maxFee: Satoshis
  }): Promise<PayInvoiceResult | LightningServiceError>
}
