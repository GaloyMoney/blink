type RawHop = {
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

type RawRoute = {
  /** Total Fee Tokens To Pay */
  fee: number
  /** Total Fee Millitokens To Pay */
  fee_mtokens: string
  hops: RawHop[]
  messages?: {
    /** Message Type number */
    type: string
    /** Message Raw Value Hex Encoded */
    value: string
  }[]
  /** Total Millitokens To Pay */
  mtokens: string
  /** Expiration Block Height */
  timeout: number
  /** Total Tokens To Pay */
  tokens: number
}

type CachedRoute = RawRoute & { pubkey: Pubkey }

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
