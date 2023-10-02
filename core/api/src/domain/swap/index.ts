export * from "./swap-out-checker"

export const SwapProvider = {
  Loop: "Loop",
} as const

export const SwapType = {
  Swapout: "swapOut",
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
