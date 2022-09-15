export * from "./swap-out-checker"

export const SwapProvider = {
  Loop: "Loop",
} as const

export const SwapType = {
  Swapout: "swapout",
  Unknown: "unknown",
} as const

export const SwapState = {
  Initiated: "initiated",
  PreimageRevealed: "preimageRevealed",
  HtlcPublished: "htlcPublished",
  Success: "success",
  Failed: "failed",
  InvoiceSettled: "invoiceSettled",
} as const

export const LoopdInstanceName = {
  Lnd1Loop: "lnd1Loop",
  Lnd2Loop: "lnd2Loop",
} as const
