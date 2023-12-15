type ObjectId = import("mongoose").Types.ObjectId

type IPType = {
  provider?: string
  country?: string
  isoCode?: string
  region?: string
  city?: string
  Type?: string
  asn?: string
  proxy?: boolean
}

type OnChainObjectForUser = {
  pubkey: string
  address: string
}

type TwilioObjectForUser = {
  carrier: {
    error_code: string // TODO: check as historical value may have number
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

interface WalletRecord {
  id: string
  accountId: string
  type: string
  currency: string
  onchain: OnChainMongooseType[]
}

interface WalletInvoiceRecord {
  _id: string
  walletId: string
  cents: number
  secret: string
  currency: string
  timestamp: Date
  selfGenerated: boolean
  processingCompleted: boolean
  pubkey: string
  paid: boolean
  paymentRequest?: string // optional because we historically did not store it
}

interface AccountRecord {
  id: string
  kratosUserId: string

  username: string | null
  role: string

  level?: number // ?: enum [1, 2]
  statusHistory: AccountStatusHistory

  withdrawFee?: number
  earn: string[]
  contactEnabled: boolean
  contacts: ContactObjectForUser[]
  created_at: Date
  onchain: OnChainObjectForUser[]
  defaultWalletId: WalletId
  displayCurrency?: string
  notificationSettings?: NotificationSettings

  // business:
  title?: string
  coordinates?: CoordinateObjectForUser

  // mongoose in-built functions
  save: () => Promise<AccountRecord>
}

interface AccountIpsRecord {
  ip: string
  metadata: {
    provider: string
    country: string
    isoCode: string
    region: string
    city: string
    Type: string
    asn: string
    proxy: boolean
  }
  firstConnection: Date
  lastConnection: Date
  accountId: string
}

interface UserRecord {
  userId: string
  language?: string
  deviceTokens: string[]
  phoneMetadata?: TwilioObjectForUser
  phone?: string
  deletedPhones?: string[]
  createdAt: Date
  deviceId?: DeviceId
  deletedEmails?: string[] | undefined
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

  btcProtocolAndBankFee: number
  usdProtocolAndBankFee: number

  recipientWalletId?: string
  recipientWalletCurrency?: string
  recipientAccountId?: string
  recipientPubkey?: string
  recipientUsername?: string
  recipientUserId?: string

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

type WalletOnChainPendingReceiveRecord = {
  walletId: string
  address: string
  transactionHash: string
  vout: number
  walletAmount: number
  walletFee: number
  walletCurrency: string
  displayAmount: string
  displayFee: string
  displayPriceBase: string
  displayPriceOffset: string
  displayPriceCurrency: string
  createdAt: Date
}
