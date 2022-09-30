import { ZERO_SATS } from "@domain/shared"
import { addAttributesToCurrentSpan } from "@services/tracing"

import { SwapErrorNonCritical, SwapServiceError } from "./errors"

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
  }): BtcPaymentAmount | SwapServiceError | SwapErrorNonCritical => {
    const isOnChainWalletDepleted =
      currentOnChainHotWalletBalance.amount < loopOutWhenHotWalletLessThanConfig.amount
    const hasEnoughOutboundLiquidity =
      currentOutboundLiquidityBalance.amount > swapOutAmount.amount
    if (!hasEnoughOutboundLiquidity) {
      addAttributesToCurrentSpan({
        "swap.checker.message": "Not enough outbound liquidity to perform swap out",
        "swap.checker.outboundAmountNeeded": Number(swapOutAmount.amount),
        "swap.checker.currentOutboundBalance": Number(
          currentOutboundLiquidityBalance.amount,
        ),
      })
      return new SwapErrorNonCritical(
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
