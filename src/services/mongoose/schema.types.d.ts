type ObjectId = import("mongoose").Types.ObjectId

type IPType = {
  ip: IpAddress | undefined
  provider?: string
  country?: string
  isoCode?: string
  region?: string
  city?: string
  Type?: string
  asn?: string
  proxy?: boolean
  firstConnection: Date
  lastConnection: Date
}

type OnChainObjectForUser = {
  pubkey: string
  address: string
}

type TwilioObjectForUser = {
  carrier: {
    error_code: string // check this is the right syntax
    mobile_country_code: string
    mobile_network_code: string
    name: string
    type: CarrierType
  }
  countryCode: string
}

type CurrencyObjectForUser = {
  id: string
  ratio: number
}

type ContactObjectForUser = {
  id?: string
  name?: string
  transactionsCount: number
}

type CoordinateObjectForUser = {
  latitude: number
  longitude: number
}

type OnChainMongooseType = {
  pubkey: string
  address: string
}

interface DbMetadataRecord {
  _id: ObjectId
  routingFeeLastEntry: Date
}

interface WalletInvoiceRecord {
  _id: string
  walletId: string
  cents: number
  secret: string
  currency: string
  timestamp: Date
  selfGenerated: boolean
  pubkey: string
  paid: boolean
}

interface UserRecord {
  _id: ObjectId
  kratosUserId: string

  username: string | null
  phone: string
  role: string

  level?: number // ?: enum [1, 2]
  statusHistory: AccountStatusHistory
  language?: string // ?: enum ["en", "es"]

  twilio?: TwilioObjectForUser
  depositFeeRatio?: number
  withdrawFee?: number
  earn: string[]
  deviceToken: string[]
  contactEnabled: boolean
  contacts: ContactObjectForUser[]
  created_at: Date
  lastConnection: Date
  onchain: OnChainObjectForUser[]
  defaultWalletId: WalletId

  lastIPs: {
    ip: string
    provider: string
    country: string
    region: string
    city: string
    //using Type instead of type due to its special status in mongoose
    Type: string
    asn?: string
    proxy?: boolean
    firstConnection: Date
    lastConnection: Date
  }[]

  // business:
  title?: string
  coordinates?: CoordinateObjectForUser

  // mongoose in-built functions
  save: () => Promise<UserRecord>
}

type PaymentFlowStateRecord = {
  _id: ObjectId
} & PaymentFlowStateRecordPartial

type PaymentFlowStateRecordPartial = XOR<
  { paymentHash: string },
  { intraLedgerHash: string }
> & {
  senderWalletId: string
  senderWalletCurrency: string
  senderAccountId: string
  settlementMethod: string
  paymentInitiationMethod: string
  createdAt: Date
  paymentSentAndPending: boolean
  descriptionFromInvoice: string
  skipProbeForDestination: boolean

  btcPaymentAmount: number
  usdPaymentAmount: number
  inputAmount: number

  btcProtocolFee: number
  usdProtocolFee: number

  recipientWalletId?: string
  recipientWalletCurrency?: string
  recipientAccountId?: string
  recipientPubkey?: string
  recipientUsername?: string

  outgoingNodePubkey?: string
  cachedRoute?: RawRoute
}

type PaymentFlowStateRecordIndex = XOR<
  { paymentHash: string },
  { intraLedgerHash: string }
> & {
  senderWalletId: string
  inputAmount: number
}
