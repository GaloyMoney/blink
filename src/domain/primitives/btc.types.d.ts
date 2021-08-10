declare const satoshisSymbol: unique symbol
type Satoshis = number & { [satoshisSymbol]: never }

declare const onchainAddressSymbol: unique symbol
type OnchainAddress = string & { [onchainAddressSymbol]: never }
