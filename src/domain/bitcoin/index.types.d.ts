declare const satoshisSymbol: unique symbol
type Satoshis = number & { [satoshisSymbol]: never }

declare const onChainAddressSymbol: unique symbol
type OnChainAddress = string & { [onChainAddressSymbol]: never }

declare const blockIdSymbol: unique symbol
type BlockId = string & { [blockIdSymbol]: never }

declare const txIdSymbol: unique symbol
type TxId = string & { [txIdSymbol]: never }
