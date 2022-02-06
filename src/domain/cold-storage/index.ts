import { toSats } from "@domain/bitcoin"

export const RebalanceChecker = ({
  minOnChainHotWalletBalance,
  minRebalanceSize,
  maxHotWalletBalance,
}: RebalanceCheckerConfig): RebalanceChecker => {
  const getWithdrawFromHotWalletAmount = ({
    onChainHotWalletBalance,
    offChainHotWalletBalance,
  }) => {
    const totalHotWallet = onChainHotWalletBalance + offChainHotWalletBalance
    if (totalHotWallet > maxHotWalletBalance) {
      const rebalanceAmount = onChainHotWalletBalance - minOnChainHotWalletBalance
      if (rebalanceAmount > minRebalanceSize) {
        return toSats(rebalanceAmount)
      }
    }

    return toSats(0n)
  }
  return {
    getWithdrawFromHotWalletAmount,
  }
}
