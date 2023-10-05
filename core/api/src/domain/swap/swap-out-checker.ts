import { ZERO_SATS } from "@/domain/shared"

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
  const getSwapOutAmount = ({
    currentOnChainHotWalletBalance,
    currentOutboundLiquidityBalance,
  }: {
    currentOnChainHotWalletBalance: BtcPaymentAmount
    currentOutboundLiquidityBalance: BtcPaymentAmount
  }): BtcPaymentAmount => {
    const isOnChainWalletDepleted =
      currentOnChainHotWalletBalance.amount < loopOutWhenHotWalletLessThanConfig.amount
    const hasEnoughOutboundLiquidity =
      currentOutboundLiquidityBalance.amount > swapOutAmount.amount
    if (!hasEnoughOutboundLiquidity) return ZERO_SATS
    if (isOnChainWalletDepleted && hasEnoughOutboundLiquidity) return swapOutAmount
    return ZERO_SATS
  }
  return {
    getSwapOutAmount,
  }
}
