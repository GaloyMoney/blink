type IPType = {
  ip: string
  provider: string
  country: string
  region: string
  city: string
  Type: string
  firstConnection: string
  lastConnection: string
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

type ConcatObjectForUser = {
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
  contacts: ConcatObjectForUser
  created_at?: string
  currencies: CurrenceyObjectForUser[]
  lastIPs?: IPType[]
  onchain?: OnChainObjectForUser[]
  lastConnection?: string

  // merchant:
  title?: string
  coordinate?: CoordinateObjectForUser

  // virtual:
  ratioUsd: number
  ratioBtc: number
  accountPath: string
  oldEnoughForWithdrawal: boolean
}

// ?: relocate
type Account = {
  level?: number
  status?: string
  language?: string
}
