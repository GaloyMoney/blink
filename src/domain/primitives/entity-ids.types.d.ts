declare const walletIdSymbol: unique symbol
type WalletId = string & { [walletIdSymbol]: never }
