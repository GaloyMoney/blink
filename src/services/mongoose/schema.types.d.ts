type IPType = {
  ip: string
  provider: string
  country: string
  region: string
  city: string
  Type: string
  firstConnection: Date
  lastConnection: Date
}

type TwoFA = {
  secret?: TwoFASecret
  threshold: number
}

type OnChainObjectForUser = {
  pubkey: string
  address: string
}

type TwillioObjectForUser = {
  carrier: string
  countryCode: string
}

type CurrenceyObjectForUser = {
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

  twilio?: TwillioObjectForUser
  depositFeeRatio?: number
  withdrawFee?: number
  earn?: string[]
  deviceToken?: string[]
  excludeCashback?: boolean
  contacts: ContactObjectForUser[]
  created_at: string
  currencies: CurrenceyObjectForUser[]
  lastIPs?: IPType[]
  onchain?: OnChainObjectForUser[]
  lastConnection: Date
  twoFA: TwoFA

  // business:
  title?: string
  coordinate?: CoordinateObjectForUser

  // virtual:
  ratioUsd: number
  ratioBtc: number
  accountPath: string
  oldEnoughForWithdrawal: boolean

  // methods
  remainingTwoFALimit: () => Promise<number>
  remainingOnUsLimit: () => Promise<number>
  remainingWithdrawalLimit: () => Promise<number>

  // mongoose in-built functions
  save: () => Promise<UserType>
}
