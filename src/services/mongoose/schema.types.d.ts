type ObjectId = import("mongoose").Types.ObjectId

type IPType = {
  ip: IpAddress | undefined
  provider?: string
  country?: string
  region?: string
  city?: string
  Type?: string
  firstConnection: Date
  lastConnection: Date
}

type TwoFAForUser = {
  secret?: TwoFASecret
  threshold: number
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

interface UserRecord {
  _id: ObjectId

  username: string | null
  phone: string
  role: string

  level?: number // ?: enum [1, 2]
  status?: string // ?: enum ["active", "locked"]
  language?: string // ?: enum ["en", "es"]

  twilio: TwilioObjectForUser | null
  depositFeeRatio?: number
  withdrawFee?: number
  earn: string[]
  deviceToken: string[]
  contacts: ContactObjectForUser[]
  created_at: Date
  lastConnection: Date
  onchain: OnChainObjectForUser[]
  twoFA: TwoFAForUser
  defaultWalletId: WalletId

  lastIPs: {
    ip: string
    provider: string
    country: string
    region: string
    city: string
    //using Type instead of type due to its special status in mongoose
    Type: string
    firstConnection: Date
    lastConnection: Date
  }[]

  // business:
  title?: string
  coordinates?: CoordinateObjectForUser

  // virtual:
  ratioUsd: number
  ratioBtc: number
  walletPath: string

  // methods
  remainingTwoFALimit: () => Promise<number>
  remainingintraLedgerLimit: () => Promise<number>
  remainingWithdrawalLimit: () => Promise<number>

  // mongoose in-built functions
  save: () => Promise<UserRecord>
}
