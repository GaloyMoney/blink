declare const satoshisSymbol: unique symbol
type Satoshis = number & { [satoshisSymbol]: never }

declare const milliSatoshisSymbol: unique symbol
type MilliSatoshis = number & { [milliSatoshisSymbol]: never }

type BtcNetwork =
  typeof import("./index").BtcNetwork[keyof typeof import("./index").BtcNetwork]
