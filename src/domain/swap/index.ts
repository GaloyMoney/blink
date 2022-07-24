export * from "./swap-out-checker"

export enum SwapProvider {
  LOOP = "LOOP",
}

export enum SwapType {
  SWAP_OUT = "SWAP_OUT",
}

export enum SwapState {
  INITIATED = "INITIATED",
  PREIMAGE_REVEALED = "PREIMAGE_REVEALED",
  HTLC_PUBLISHED = "HTLC_PUBLISHED",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  INVOICE_SETTLED = "INVOICE_SETTLED",
}
