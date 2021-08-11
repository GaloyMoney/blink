declare const satoshisSymbol: unique symbol
type Satoshis = number & { [satoshisSymbol]: never }

declare const onchainAddressSymbol: unique symbol
type OnchainAddress = string & { [onchainAddressSymbol]: never }

declare const blockIdSymbol: unique symbol
type BlockId = string & { [blockIdSymbol]: never }

declare const txIdSymbol: unique symbol
type TxId = string & { [txIdSymbol]: never }
