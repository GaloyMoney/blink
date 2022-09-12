import { LoopService } from "@services/loopd"

import { toSats } from "@domain/bitcoin"
import {
  SwapClientNotResponding,
  SwapErrorChannelBalanceTooLow,
} from "@domain/swap/errors"
import { SwapOutChecker } from "@domain/swap"
import { lndsBalances } from "@services/lnd/utils"
import { getSwapDestAddress } from "@app/swap/get-swap-dest-address"
import {
  getActiveLoopd,
  LND1_LOOP_CONFIG,
  LND2_LOOP_CONFIG,
} from "@app/swap/get-active-loopd"

describe("Swap", () => {
  const activeLoopd = getActiveLoopd()
  const swapService = LoopService(activeLoopd ?? LND1_LOOP_CONFIG)
  const amount = toSats(250000)

  it("Swap out returns successful swap result for default active loop node or lnd1-loop node", async () => {
    const isSwapServerUp = await swapService.healthCheck()
    if (isSwapServerUp instanceof Error === false) {
      const swapDestAddress = await getSwapDestAddress()
      if (swapDestAddress instanceof Error) return swapDestAddress
      const swapResult = await swapService.swapOut({ amount, swapDestAddress })
      if (swapResult instanceof SwapClientNotResponding) {
        console.log("Swap Client is not running, skipping")
        return
      }
      if (swapResult instanceof Error) throw swapResult
      expect(swapResult).not.toBeInstanceOf(Error)
      expect(swapResult).toEqual(
        expect.objectContaining({
          swapId: expect.any(String),
        }),
      )
    }
  })

  it("Swap out returns successful swap result for lnd2-loop node or error if not enough funds", async () => {
    const isSwapServerUp = await swapService.healthCheck()
    if (isSwapServerUp instanceof Error === false) {
      const loopService = LoopService(LND2_LOOP_CONFIG)
      const swapServiceLnd2 = loopService
      const isSwapServerUp2 = await swapServiceLnd2.healthCheck()
      if (isSwapServerUp2 instanceof Error === false) {
        const swapDestAddress = await getSwapDestAddress()
        if (swapDestAddress instanceof Error) return swapDestAddress
        // this might fail in not enough funds in LND2 in regtest
        const swapResult = await swapServiceLnd2.swapOut({ amount, swapDestAddress })
        if (swapResult instanceof SwapClientNotResponding) {
          console.log("Swap Client is not running, skipping")
          return
        }
        if (swapResult instanceof Error) {
          if (swapResult instanceof SwapErrorChannelBalanceTooLow) {
            expect(swapResult).toBeInstanceOf(SwapErrorChannelBalanceTooLow)
          } else {
            expect(swapResult).not.toBeInstanceOf(Error)
          }
        } else {
          expect(swapResult).toEqual(
            expect.objectContaining({
              swapId: expect.any(String),
            }),
          )
        }
      }
    }
  })

  it("Swap out without enough funds returns an error", async () => {
    const isSwapServerUp = await swapService.healthCheck()
    if (isSwapServerUp instanceof Error === false) {
      const swapResult = await swapService.swapOut({ amount: toSats(5000000000) })
      if (swapResult instanceof SwapClientNotResponding) {
        return
      }
      expect(swapResult).toBeInstanceOf(Error)
    }
  })

  it("Swap out if on chain wallet is depleted returns a swap result", async () => {
    const isSwapServerUp = await swapService.healthCheck()
    if (isSwapServerUp instanceof Error === false) {
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

  it("Swap out quote return quote result", async () => {
    const isSwapServerUp = await swapService.healthCheck()
    if (isSwapServerUp instanceof Error === false) {
      const quoteResult = await swapService.swapOutQuote(toSats(250000))
      expect(quoteResult).not.toBeInstanceOf(Error)
      expect(quoteResult).toEqual(
        expect.objectContaining({
          swapFeeSat: expect.any(Number),
        }),
      )
    } else {
      expect("No swap Needed").toEqual("No swap Needed")
    }
  })

  it("Swap out terms return terms result", async () => {
    const isSwapServerUp = await swapService.healthCheck()
    if (isSwapServerUp instanceof Error === false) {
      const termsResult = await swapService.swapOutTerms()
      expect(termsResult).not.toBeInstanceOf(Error)
      expect(termsResult).toEqual(
        expect.objectContaining({
          minSwapAmount: expect.any(Number),
        }),
      )
    } else {
      expect("No swap Needed").toEqual("No swap Needed")
    }
  })
})
