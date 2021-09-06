declare const usdPerSatSymbol: unique symbol
type UsdPerSat = number & { [usdPerSatSymbol]: never }

declare const userIdSymbol: unique symbol
type UserId = string & { [userIdSymbol]: never }

declare const pubkeySymbol: unique symbol
type Pubkey = string & { [pubkeySymbol]: never }

declare const walletIdSymbol: unique symbol
type WalletId = string & { [walletIdSymbol]: never }

declare const walletNameSymbol: unique symbol
type WalletName = string & { [walletNameSymbol]: never }

declare const accountIdSymbol: unique symbol
type AccountId = string & { [accountIdSymbol]: never }

declare const unixTimeMsSymbol: unique symbol
type UnixTimeMs = number & { [unixTimeMsSymbol]: never }

type TxDenominationCurrency = "USD" | "BTC"
