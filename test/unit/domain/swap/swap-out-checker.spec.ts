import { toSats } from "@domain/bitcoin"
import { SwapOutChecker } from "@domain/swap"
import { SwapServiceError } from "@domain/swap/errors"

describe("SwapOutChecker", () => {
  it("returns the amount that should be swapped", () => {
    const checker = SwapOutChecker({
      minOnChainHotWalletBalanceConfig: toSats(50000),
      swapOutAmount: toSats(250000),
    })
    expect(
      checker.getSwapOutAmount({
        currentOnChainHotWalletBalance: toSats(40000),
        currentOutboundLiquidityBalance: toSats(300000),
      }),
    ).toEqual(toSats(250000))
  })

  it("returns 0 amount when we don't need a swap out", () => {
    const checker = SwapOutChecker({
      minOnChainHotWalletBalanceConfig: toSats(50000),
      swapOutAmount: toSats(250000),
    })
    expect(
      checker.getSwapOutAmount({
        currentOnChainHotWalletBalance: toSats(100000),
        currentOutboundLiquidityBalance: toSats(300000),
      }),
    ).toEqual(toSats(0))
  })

  it("returns an error when we don't have enough outbound liquidity to perform a swap out", () => {
    const checker = SwapOutChecker({
      minOnChainHotWalletBalanceConfig: toSats(50000),
      swapOutAmount: toSats(250000),
    })
    expect(
      checker.getSwapOutAmount({
        currentOnChainHotWalletBalance: toSats(10000),
        currentOutboundLiquidityBalance: toSats(500),
      }),
    ).toBeInstanceOf(SwapServiceError)
  })
})
