declare const usdPerSatSymbol: unique symbol
type UsdPerSat = number & { [usdPerSatSymbol]: never }

declare const userIdSymbol: unique symbol
type UserId = string & { [userIdSymbol]: never }

declare const usernameSymbol: unique symbol
type Username = string & { [usernameSymbol]: never }

declare const pubkeySymbol: unique symbol
type Pubkey = string & { [pubkeySymbol]: never }

declare const walletIdSymbol: unique symbol
type WalletId = string & { [walletIdSymbol]: never }

declare const walletPublicIdSymbol: unique symbol
type WalletPublicId = string & { [walletPublicIdSymbol]: never }

declare const accountIdSymbol: unique symbol
type AccountId = string & { [accountIdSymbol]: never }

declare const secondsSymbol: unique symbol
type Seconds = number & { [secondsSymbol]: never }

declare const jwtTokenSymbol: unique symbol
type JwtToken = string & { [jwtTokenSymbol]: never }

type TxDenominationCurrency = "USD" | "BTC"
