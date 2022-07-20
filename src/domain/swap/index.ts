// checks if swap out is needed
export const SwapOutChecker = ({
  currentOnChainHotWalletBalance,
  minOnChainHotWalletBalanceConfig,
  currentOutboundLiquidityBalance,
  minOutboundLiquidityBalance,
}) => {
  const isOnChainWalletDepleted = () => {
    if (currentOnChainHotWalletBalance < minOnChainHotWalletBalanceConfig) {
      return true
    } else {
      return false
    }
  }
  const isOutboundLiquidityDepleted = () => {
    if (currentOutboundLiquidityBalance < minOutboundLiquidityBalance) {
      return true
    } else {
      return false
    }
  }
  return {
    isOnChainWalletDepleted,
    isOutboundLiquidityDepleted,
  }
}

export enum SwapProvider {
  LOOP = "LOOP",
  PEERSWAP = "PEERSWAP",
}

export enum SwapType {
  SWAP_IN = "SWAP_IN",
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
