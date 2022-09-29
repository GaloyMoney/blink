import { ZERO_SATS } from "@domain/shared"

import { SwapServiceError } from "./errors"

export const SwapOutChecker = ({
  loopOutWhenHotWalletLessThanConfig,
  swapOutAmount,
}: {
  loopOutWhenHotWalletLessThanConfig: BtcPaymentAmount
  swapOutAmount: BtcPaymentAmount
}) => {
  // checks the amount of "swap out" that is need
  // if return "0" then no swap out needed
  // if return an "amount" then swapout needed
  // if return "error" then we don't have enough outbound
  //   liquidity to perform a swap out.
  const getSwapOutAmount = ({
    currentOnChainHotWalletBalance,
    currentOutboundLiquidityBalance,
  }: {
    currentOnChainHotWalletBalance: BtcPaymentAmount
    currentOutboundLiquidityBalance: BtcPaymentAmount
  }): BtcPaymentAmount | SwapServiceError => {
    const isOnChainWalletDepleted =
      currentOnChainHotWalletBalance.amount < loopOutWhenHotWalletLessThanConfig.amount
    const hasEnoughOutboundLiquidity =
      currentOutboundLiquidityBalance.amount > swapOutAmount.amount
    if (!hasEnoughOutboundLiquidity) {
      return new SwapServiceError(
        `Not enough outbound liquidity. Need at least ${swapOutAmount.amount} but we only have ${currentOutboundLiquidityBalance.amount}`,
      )
    }
    if (isOnChainWalletDepleted && hasEnoughOutboundLiquidity) {
      return swapOutAmount
    }
    return ZERO_SATS
  }
  return {
    getSwapOutAmount,
  }
}
