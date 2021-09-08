type RawProbedHop = {
  /** Standard Format Channel Id */
  channel: string
  /** Channel Capacity Tokens */
  channel_capacity: number
  /** Fee */
  fee: number
  /** Fee Millitokens */
  fee_mtokens: string
  /** Forward Tokens */
  forward: number
  /** Forward Millitokens */
  forward_mtokens: string
  /** Public Key Hex */
  public_key?: string
  /** Timeout Block Height */
  timeout: number
}

type RawProbedRoute = {
  /** Route Confidence Score Out Of One Million Number */
  confidence?: number
  /** Route Fee Tokens Rounded Down Number */
  fee: number
  /** Route Fee Millitokens String */
  fee_mtokens: string
  hops: RawProbedHop[]
  messages?: {
    /** Message Type Number String */
    type: string
    /** Message Raw Value Hex Encoded String */
    value: string
  }[]
  /** Total Fee-Inclusive Millitokens String */
  mtokens: string
  /** Payment Identifier Hex String */
  payment?: string
  /** Payment Forwarding Fee Rounded Up Tokens Number */
  safe_fee: number
  /** Payment Tokens Rounded Up Number */
  safe_tokens: number
  /** Timeout Block Height Number */
  timeout: number
  /** Total Fee-Inclusive Tokens Rounded Down Number */
  tokens: number
  /** Total Millitokens String */
  total_mtokens?: string
}

type CachedRoute = RawProbedRoute & { pubkey: Pubkey }

type RawInvoiceHop = {
  /** Base Routing Fee In Millitokens */
  base_fee_mtokens?: string
  /** Standard Format Channel Id */
  channel?: string
  /** CLTV Blocks Delta */
  cltv_delta?: number
  /** Fee Rate In Millitokens Per Million */
  fee_rate?: number
  /** Forward Edge Public Key Hex */
  public_key: string
}

interface IRoutesRepository {
  findByPaymentHash: ({
    paymentHash,
    milliSatsAmounts,
  }: {
    paymentHash: PaymentHash
    milliSatsAmounts: MilliSatoshis
  }) => Promise<CachedRoute | RepositoryError>

  deleteByPaymentHash: ({
    paymentHash,
    milliSatsAmounts,
  }: {
    paymentHash: PaymentHash
    milliSatsAmounts: MilliSatoshis
  }) => Promise<void | RepositoryError>
}
