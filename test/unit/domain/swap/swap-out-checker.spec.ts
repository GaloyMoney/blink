import { SwapOutChecker } from "@domain/swap"

describe("SwapOutChecker", () => {
  it("checks if a Swap Out is needed", () => {
    const checker = SwapOutChecker({
      currentOnChainHotWalletBalance: 10000,
      minOnChainHotWalletBalanceConfig: 50000,
      currentOutboundLiquidityBalance: 60000,
      minOutboundLiquidityBalance: 70000,
    })
    expect(checker.isOnChainWalletDepleted()).toEqual(true)
    expect(checker.isOutboundLiquidityDepleted()).toEqual(true)
  })
})
