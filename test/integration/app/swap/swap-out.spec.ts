import { SwapService } from "@services/swap"

import { toSats } from "@domain/bitcoin"
import { SwapClientNotResponding } from "@domain/swap/errors"
import { SwapOutChecker } from "@domain/swap"
import { lndsBalances } from "@services/lnd/utils"
import { getSwapConfig } from "@config"

describe("Swap", () => {
  const swapService = SwapService()
  const amount = toSats(250000)

  it("Swap out returns successful swap result for default lnd1-loop server", async () => {
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

  it("Swap out returns successful swap result for lnd2-loop server", async () => {
    if (await swapService.healthCheck()) {
      if (process.env.LND2_LOOP_MACAROON && process.env.LND2_LOOP_TLS) {
        const swapServiceLnd2 = SwapService(
          process.env.LND2_LOOP_MACAROON.toString(),
          process.env.LND2_LOOP_TLS,
          getSwapConfig().lnd2loopRpcEndpoint,
        )
        if (await swapServiceLnd2.healthCheck()) {
          // TODO this might fail in not enough funds in LND2
          const swapResult = await swapServiceLnd2.swapOut(amount)
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
      } else {
        throw Error("no process.env.LND2_LOOP_MACAROON && process.env.LND2_LOOP_TLS")
      }
    }
  })

  it("swap out without enough funds returns an error", async () => {
    if (await swapService.healthCheck()) {
      const swapResult = await swapService.swapOut(toSats(5000000000))
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
      const minOnChainHotWalletBalanceConfig = onChain + 50000

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
