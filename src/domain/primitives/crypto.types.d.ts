declare const pubkeySymbol: unique symbol
type Pubkey = string & { [pubkeySymbol]: never }
