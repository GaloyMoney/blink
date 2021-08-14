declare const usernameSymbol: unique symbol
type Username = string & { [usernameSymbol]: never }

declare const pubkeySymbol: unique symbol
type Pubkey = string & { [pubkeySymbol]: never }

declare const walletIdSymbol: unique symbol
type WalletId = string & { [walletIdSymbol]: never }

type TxDenominationCurrency = "USD" | "BTC"
