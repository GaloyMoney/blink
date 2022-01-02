type IPType = {
  ip: string
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

// ?: improve this
interface UserType {
  _id: string
  id: string
  username?: string
  phone: string
  role: string

  level?: number // ?: enum [1, 2]
  status?: string // ?: enum ["active", "locked"]
  language?: string // ?: enum ["en", "es"]

  twilio?: TwilioObjectForUser
  depositFeeRatio?: number
  withdrawFee?: number
  earn?: string[]
  deviceToken?: string[]
  excludeCashback?: boolean
  contacts: ContactObjectForUser[]
  created_at: string
  currencies: CurrencyObjectForUser[]
  onchain: OnChainObjectForUser[]
  twoFA: TwoFAForUser
  walletId: WalletId

  // business:
  title?: string
  coordinates?: CoordinateObjectForUser

  // virtual:
  ratioUsd: number
  ratioBtc: number
  walletPath: string
  oldEnoughForWithdrawal: boolean

  // methods
  remainingTwoFALimit: () => Promise<number>
  remainingOnUsLimit: () => Promise<number>
  remainingWithdrawalLimit: () => Promise<number>

  // mongoose in-built functions
  save: () => Promise<UserType>
}

// ?: improve this
interface UserIPsType {
  _id: string
  id: string
  lastIPs?: IPType[]
}
