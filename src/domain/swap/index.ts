// checks if swap out is needed
export const SwapOutChecker = ({
  currentOnChainHotWalletBalance,
  minOnChainHotWalletBalanceConfig,
}) => {
  const isOnChainWalletDepleted = () => {
    if (currentOnChainHotWalletBalance < minOnChainHotWalletBalanceConfig) {
      return true
    } else {
      return false
    }
  }

  return {
    isOnChainWalletDepleted,
  }
}

export enum SwapProvider {
  LOOP,
  PEERSWAP,
}

export enum SwapType {
  SWAP_IN,
  SWAP_OUT,
}

export enum SwapState {
  INITIATED,
  PREIMAGE_REVEALED,
  HTLC_PUBLISHED,
  SUCCESS,
  FAILED,
  INVOICE_SETTLED,
}
