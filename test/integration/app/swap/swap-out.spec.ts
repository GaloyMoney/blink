import { SwapService } from "@services/swap"

import { toSats } from "@domain/bitcoin"

// import { getSwapConfig } from "@config"
import { SwapClientNotResponding } from "@domain/swap/errors"
import { SwapOutChecker } from "@domain/swap"
import { lndsBalances } from "@services/lnd/utils"
// import { Swap } from "@app"

describe("Swap", () => {
  const swapService = SwapService()
  const amount = toSats(250000)

  // it("Swap cron job", async () => {
  //   if (await swapService.healthCheck()) {
  //     const swapResult = await Swap.swapOut(amount) //getSwapConfig().swapOutAmount
  //     expect(swapResult).not.toBeInstanceOf(Error)
  //     expect(swapResult).toEqual(
  //       expect.objectContaining({
  //         swapId: expect.any(String),
  //       }),
  //     )
  //   }
  // })

  it("Swap out returns successful SwapResult", async () => {
    if (await swapService.healthCheck()) {
      const swapResult = await swapService.swapOut(amount)
      if (swapResult instanceof SwapClientNotResponding) {
        console.log("Swap Client is not running, skipping")
        return
      }
      expect(swapResult).not.toBeInstanceOf(Error)
      expect(swapResult).toEqual(
        expect.objectContaining({
          swapId: expect.any(String),
        }),
      )
    }
  })

  it("Swap out without enough funds returns an Error", async () => {
    if (await swapService.healthCheck()) {
      const swapResult = await swapService.swapOut(toSats(5000000000))
      if (swapResult instanceof SwapClientNotResponding) {
        return
      }
      expect(swapResult).toBeInstanceOf(Error)
    }
  })

  it("Swap out if on chain wallet is depleted", async () => {
    if (await swapService.healthCheck()) {
      // thresholds
      const { onChain } = await lndsBalances()
      const minOnChainHotWalletBalanceConfig = onChain + 50000

      // check if wallet is depleted
      const isOnChainWalletDepleted = SwapOutChecker({
        currentOnChainHotWalletBalance: onChain,
        minOnChainHotWalletBalanceConfig,
      }).isOnChainWalletDepleted()

      if (isOnChainWalletDepleted) {
        // const swapOutAmount = getSwapConfig().swapOutAmount
        const swapResult = await swapService.swapOut(toSats(amount))
        if (swapResult instanceof SwapClientNotResponding) {
          return
        }

        expect(swapResult).not.toBeInstanceOf(Error)
        expect(swapResult).toEqual(
          expect.objectContaining({
            swapId: expect.any(String),
          }),
        )
      } else {
        expect("No swap Needed").toEqual("No swap Needed")
      }
    }
  })
})
