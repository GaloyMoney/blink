import { LoopService } from "@services/loopd"

import { toSats } from "@domain/bitcoin"
import { SwapClientNotResponding } from "@domain/swap/errors"
import { SwapOutChecker } from "@domain/swap"
import { lndsBalances } from "@services/lnd/utils"
import { getSwapDestAddress } from "@app/swap/get-swap-dest-address"
import { LND1_LOOP_CONFIG, LND2_LOOP_CONFIG } from "@app/swap/get-active-loopd"

describe("Swap", () => {
  // const activeLoopd = getActiveLoopd()
  const swapService = LoopService(LND1_LOOP_CONFIG)
  const amount = toSats(250000)

  it("Swap out returns successful swap result for default lnd1-loop node", async () => {
    if (await swapService.healthCheck()) {
      const swapResult = await swapService.swapOut({
        amount,
      })
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

  it("Swap out returns successful swap result for lnd2-loop node", async () => {
    if (await swapService.healthCheck()) {
      const loopService = LoopService(LND2_LOOP_CONFIG)
      const swapServiceLnd2 = loopService
      if (await swapServiceLnd2.healthCheck()) {
        const swapDestAddress = await getSwapDestAddress()
        let params
        if (swapDestAddress instanceof String) {
          params = {
            amount,
            swapDestAddress,
          }
        } else {
          params = { amount }
        }
        // TODO this might fail in not enough funds in LND2
        const swapResult = await swapServiceLnd2.swapOut(params)
        if (swapResult instanceof SwapClientNotResponding) {
          console.log("Swap Client is not running, skipping")
          return
        }
        if (swapResult instanceof Error) {
          throw swapResult
        }
        expect(swapResult).not.toBeInstanceOf(Error)
        expect(swapResult).toEqual(
          expect.objectContaining({
            swapId: expect.any(String),
          }),
        )
      }
    }
  })

  it("swap out without enough funds returns an error", async () => {
    if (await swapService.healthCheck()) {
      const swapResult = await swapService.swapOut({ amount: toSats(5000000000) })
      if (swapResult instanceof SwapClientNotResponding) {
        return
      }
      expect(swapResult).toBeInstanceOf(Error)
    }
  })

  it("Swap out if on chain wallet is depleted returns a swap result", async () => {
    if (await swapService.healthCheck()) {
      // thresholds
      const { onChain } = await lndsBalances()
      const minOnChainHotWalletBalanceConfig = toSats(onChain + 50000)

      // check if wallet is depleted
      const swapOutChecker = SwapOutChecker({
        minOnChainHotWalletBalanceConfig,
        swapOutAmount: amount,
      })
      const amountToSwapOut = swapOutChecker.getSwapOutAmount({
        currentOnChainHotWalletBalance: toSats(0),
        currentOutboundLiquidityBalance: toSats(0),
      })

      if (amountToSwapOut > 0) {
        // const swapOutAmount = getSwapConfig().swapOutAmount
        const swapResult = await swapService.swapOut({ amount: toSats(amount) })
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
