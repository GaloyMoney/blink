type Unique = { readonly brand: unique symbol }

type UsdPerSat = number & Unique
type UserId = string & Unique
type Username = string & Unique
type Pubkey = string & Unique
type WalletId = string & Unique
type AccountId = string & Unique
type Seconds = number & Unique
type MilliSeconds = number & Unique
type JwtToken = string & Unique

type TxDenominationCurrency = "USD" | "BTC"
