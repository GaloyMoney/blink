import { WalletCurrency, ZERO_SATS } from "@/domain/shared"
import { SwapOutChecker } from "@/domain/swap"

describe("SwapOutChecker", () => {
  it("returns the amount that should be swapped", () => {
    const checker = SwapOutChecker({
      loopOutWhenHotWalletLessThanConfig: {
        amount: BigInt(50000),
        currency: WalletCurrency.Btc,
      },
      swapOutAmount: {
        amount: BigInt(250000),
        currency: WalletCurrency.Btc,
      },
    })
    expect(
      checker.getSwapOutAmount({
        currentOnChainHotWalletBalance: {
          amount: BigInt(40000),
          currency: WalletCurrency.Btc,
        },
        currentOutboundLiquidityBalance: {
          amount: BigInt(300000),
          currency: WalletCurrency.Btc,
        },
      }),
    ).toEqual({ amount: BigInt(250000), currency: WalletCurrency.Btc })
  })

  it("returns 0 amount when we don't need a swap out", () => {
    const checker = SwapOutChecker({
      loopOutWhenHotWalletLessThanConfig: {
        amount: BigInt(50000),
        currency: WalletCurrency.Btc,
      },
      swapOutAmount: {
        amount: BigInt(250000),
        currency: WalletCurrency.Btc,
      },
    })
    expect(
      checker.getSwapOutAmount({
        currentOnChainHotWalletBalance: {
          amount: BigInt(100000),
          currency: WalletCurrency.Btc,
        },
        currentOutboundLiquidityBalance: {
          amount: BigInt(300000),
          currency: WalletCurrency.Btc,
        },
      }),
    ).toEqual(ZERO_SATS)
  })

  it("returns 0 amount when we don't have enough outbound liquidity to perform a swap out", () => {
    const checker = SwapOutChecker({
      loopOutWhenHotWalletLessThanConfig: {
        amount: BigInt(50000),
        currency: WalletCurrency.Btc,
      },
      swapOutAmount: {
        amount: BigInt(250000),
        currency: WalletCurrency.Btc,
      },
    })
    expect(
      checker.getSwapOutAmount({
        currentOnChainHotWalletBalance: {
          amount: BigInt(10000),
          currency: WalletCurrency.Btc,
        },
        currentOutboundLiquidityBalance: {
          amount: BigInt(500),
          currency: WalletCurrency.Btc,
        },
      }),
    ).toEqual(ZERO_SATS)
  })
})
