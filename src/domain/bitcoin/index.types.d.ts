declare const satoshisSymbol: unique symbol
type Satoshis = number & { [satoshisSymbol]: never }

declare const mSatoshisSymbol: unique symbol
type MSatoshis = number & { [mSatoshisSymbol]: never }

type BtcNetwork =
  typeof import("./index").BtcNetwork[keyof typeof import("./index").BtcNetwork]
