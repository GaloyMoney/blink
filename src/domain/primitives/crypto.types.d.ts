declare const pubKeySymbol: unique symbol
type Pubkey = string & { [walletIdSymbol]: never }
