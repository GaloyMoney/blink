import { toSats } from "@domain/bitcoin"

import { SwapServiceError } from "./errors"

// checks the amount of "swap out" that is need
// if return "0" then no swap out needed
// if return an "amount" then swapout needed
// if return "error" then we don't have enough outbound
//   liquidity to perform a swap out.
export const SwapOutChecker = ({ minOnChainHotWalletBalanceConfig, swapOutAmount }) => {
  const getSwapOutAmount = ({
    currentOnChainHotWalletBalance,
    currentOutboundLiquidityBalance,
  }): Satoshis | SwapServiceError => {
    const isOnChainWalletDepleted =
      currentOnChainHotWalletBalance < minOnChainHotWalletBalanceConfig
    const hasEnoughOutboundLiquidity = currentOutboundLiquidityBalance > swapOutAmount
    if (!hasEnoughOutboundLiquidity) {
      return new SwapServiceError(
        `Not enough outbound liquidity. Need at least ${swapOutAmount} but we only have ${currentOutboundLiquidityBalance}`,
      )
    }
    if (isOnChainWalletDepleted && hasEnoughOutboundLiquidity) {
      return toSats(swapOutAmount)
    }
    return toSats(0)
  }
  return {
    getSwapOutAmount,
  }
}
