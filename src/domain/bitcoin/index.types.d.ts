declare const satoshisSymbol: unique symbol
type Satoshis = number & { [satoshisSymbol]: never }

type BtcNetwork =
  typeof import("./index").BtcNetwork[keyof typeof import("./index").BtcNetwork]
