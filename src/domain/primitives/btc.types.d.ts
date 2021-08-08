declare const satoshisSymbol: unique symbol
type Satoshis = number & { [satoshisSymbol]: never }
