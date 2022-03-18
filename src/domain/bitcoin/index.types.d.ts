type Satoshis = number & { readonly brand: unique symbol }
type TargetConfirmations = number & { readonly brand: unique symbol }
type MilliSatoshis = number & { readonly brand: unique symbol }
type BtcNetwork =
  typeof import("./index").BtcNetwork[keyof typeof import("./index").BtcNetwork]

// positive means swap out imbalance
type SwapOutImbalance = number & { readonly brand: unique symbol }
