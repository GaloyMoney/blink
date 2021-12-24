type Satoshis = number & Unique
type TargetConfirmations = number & Unique
type MilliSatoshis = number & Unique

type BtcNetwork =
  typeof import("./index").BtcNetwork[keyof typeof import("./index").BtcNetwork]
