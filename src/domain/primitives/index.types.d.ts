type DisplayCurrencyPerSat = number & { readonly brand: unique symbol }
type DisplayCurrencyBasePerSat = number & { readonly brand: unique symbol }
type UserId = string & { readonly brand: unique symbol }
type Username = string & { readonly brand: unique symbol }
type Pubkey = string & { readonly brand: unique symbol }
type WalletId = string & { readonly brand: unique symbol }
type AccountId = string & { readonly brand: unique symbol }
type Seconds = number & { readonly brand: unique symbol }
type MilliSeconds = number & { readonly brand: unique symbol }
type Days = number & { readonly brand: unique symbol }
type JwtToken = string & { readonly brand: unique symbol }
type Memo = string & { readonly brand: unique symbol }

type XOR<T1, T2> =
  | (T1 & { [k in Exclude<keyof T2, keyof T1>]?: never })
  | (T2 & { [k in Exclude<keyof T1, keyof T2>]?: never })
