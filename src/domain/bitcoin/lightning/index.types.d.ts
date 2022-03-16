type LightningError = import("./errors").LightningError
type LnInvoiceDecodeError = import("./errors").LnInvoiceDecodeError
type LightningServiceError = import("./errors").LightningServiceError
type RouteNotFoundError = import("./errors").RouteNotFoundError

type InvoiceExpiration = Date & { readonly brand: unique symbol }
type EncodedPaymentRequest = string & { readonly brand: unique symbol }
type PaymentHash = string & { readonly brand: unique symbol }
type SecretPreImage = string & { readonly brand: unique symbol }
type RevealedPreImage = string & { readonly brand: unique symbol }
type PaymentIdentifyingSecret = string & { readonly brand: unique symbol }
type FeatureBit = number & { readonly brand: unique symbol }
type FeatureType = string & { readonly brand: unique symbol }

type PagingStartToken = undefined
type PagingContinueToken = string & { readonly brand: unique symbol }
type PagingStopToken = false

type RouteValidator = {
  validate(amount: Satoshis): true | ValidationError
}

type PaymentStatus =
  typeof import("./index").PaymentStatus[keyof typeof import("./index").PaymentStatus]

type FailedPaymentStatus = typeof import("./index").PaymentStatus.Failed

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
  readonly createdAt: Date
  readonly confirmedAt: Date | undefined
  readonly isSettled: boolean
  readonly roundedDownReceived: Satoshis
  readonly milliSatsReceived: MilliSatoshis
  readonly secretPreImage: SecretPreImage
  readonly lnInvoice: {
    readonly description: string
    readonly paymentRequest: EncodedPaymentRequest | undefined
    readonly expiresAt: Date
    readonly roundedDownAmount: Satoshis
  }
}

type GetPaymentsResults = import("lightning").GetPaymentsResult
type GetFailedPaymentsResults = import("lightning").GetFailedPaymentsResult
type LnPaymentAttempt =
  | GetPaymentsResults["payments"][number]["attempts"][number]
  | GetFailedPaymentsResults["payments"][number]["attempts"][number]

type LnPaymentConfirmedDetails = {
  readonly confirmedAt: Date
  readonly destination: Pubkey
  readonly revealedPreImage: RevealedPreImage
  readonly roundedUpFee: Satoshis
  readonly milliSatsFee: MilliSatoshis
  readonly hopPubkeys: Pubkey[] | undefined
}

type LnPaymentLookup = {
  readonly createdAt: Date
  readonly status: PaymentStatus
  readonly paymentHash: PaymentHash
  readonly paymentRequest: EncodedPaymentRequest | undefined
  readonly milliSatsAmount: MilliSatoshis
  readonly roundedUpAmount: Satoshis

  readonly confirmedDetails: LnPaymentConfirmedDetails | undefined
  readonly attempts: LnPaymentAttempt[] | undefined
}

type LnFailedPartialPaymentLookup = {
  readonly status: FailedPaymentStatus
}

type LnInvoice = {
  readonly destination: Pubkey
  readonly paymentHash: PaymentHash
  readonly paymentRequest: EncodedPaymentRequest
  readonly milliSatsAmount: MilliSatoshis
  readonly description: string
  readonly cltvDelta: number | null
  readonly amount: Satoshis | null
  readonly paymentAmount: BtcPaymentAmount | null
  readonly routeHints: Hop[][]
  readonly paymentSecret: PaymentIdentifyingSecret | null
  readonly features: LnInvoiceFeature[]
  readonly expiresAt: Date
  readonly isExpired: boolean
}

type RegisterInvoiceArgs = {
  description: string
  descriptionHash?: string
  sats: Satoshis
  expiresAt: InvoiceExpiration
}

type RegisteredInvoice = {
  invoice: LnInvoice
  pubkey: Pubkey
  descriptionHash?: string // TODO: proper type
}

type LnFeeCalculator = {
  max<T extends UsdCents | Satoshis>(amount: T): T
  inverseMax<T extends UsdCents | Satoshis>(amount: T): T
}

type PayInvoiceResult = {
  roundedUpFee: Satoshis
  revealedPreImage: RevealedPreImage
  sentFromPubkey: Pubkey
}

type ListLnPaymentsArgs = {
  after: PagingStartToken | PagingContinueToken
  pubkey: Pubkey
}

type ListLnPaymentsResult = {
  lnPayments: LnPaymentLookup[]
  endCursor: PagingContinueToken | PagingStopToken
}

type ListLnPayments = (
  args: ListLnPaymentsArgs,
) => Promise<ListLnPaymentsResult | LightningError>

type LightningServiceConfig = {
  feeCapPercent: number
}

interface ILightningService {
  isLocal(pubkey: Pubkey): boolean | LightningServiceError

  defaultPubkey(): Pubkey

  listActivePubkeys(): Pubkey[]

  listAllPubkeys(): Pubkey[]

  findRouteForInvoice({
    decodedInvoice,
    maxFee,
  }: {
    decodedInvoice: LnInvoice
    maxFee: Satoshis
  }): Promise<RawRoute | LightningServiceError>

  findRouteForInvoiceNew({
    invoice,
    amount,
  }: {
    invoice: LnInvoice
    amount?: BtcPaymentAmount
  }): Promise<{ pubkey: Pubkey; rawRoute: RawRoute } | LightningServiceError>

  findRouteForNoAmountInvoice({
    decodedInvoice,
    maxFee,
    amount,
  }: {
    decodedInvoice: LnInvoice
    maxFee: Satoshis
    amount: Satoshis
  }): Promise<RawRoute | LightningServiceError>

  registerInvoice(
    args: RegisterInvoiceArgs,
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
    pubkey?: Pubkey
    paymentHash: PaymentHash
  }): Promise<LnPaymentLookup | LnFailedPartialPaymentLookup | LightningServiceError>

  listSettledPayments: ListLnPayments

  listPendingPayments(
    args: ListLnPaymentsArgs,
  ): Promise<ListLnPaymentsResult | LightningServiceError>

  listFailedPayments: ListLnPayments

  listSettledAndPendingPayments(
    args: ListLnPaymentsArgs,
  ): Promise<ListLnPaymentsResult | LightningServiceError>

  cancelInvoice({
    pubkey,
    paymentHash,
  }: {
    pubkey: Pubkey
    paymentHash: PaymentHash
  }): Promise<true | LightningServiceError>

  payInvoiceViaRoutes({
    paymentHash,
    rawRoute,
    pubkey,
  }: {
    paymentHash: PaymentHash
    rawRoute: RawRoute | undefined
    pubkey: Pubkey | undefined
  }): Promise<PayInvoiceResult | LightningServiceError>

  payInvoiceViaPaymentDetails({
    decodedInvoice,
    milliSatsAmount,
    maxFee,
  }: {
    decodedInvoice: LnInvoice
    milliSatsAmount: MilliSatoshis | bigint
    maxFee: Satoshis | bigint
  }): Promise<PayInvoiceResult | LightningServiceError>

  newPayInvoiceViaPaymentDetails({
    decodedInvoice,
    btcPaymentAmount,
    maxFeeAmount,
  }: {
    decodedInvoice: LnInvoice
    btcPaymentAmount: BtcPaymentAmount
    maxFeeAmount: BtcPaymentAmount
  }): Promise<PayInvoiceResult | LightningServiceError>
}
