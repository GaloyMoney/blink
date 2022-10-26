import { swapOut } from "@app/swap"
import {
  getActiveLoopd,
  lnd1LoopConfig,
  lnd2LoopConfig,
} from "@app/swap/get-active-loopd"
import { getSwapDestAddress } from "@app/swap/get-swap-dest-address"

import {
  SwapClientNotResponding,
  SwapErrorChannelBalanceTooLow,
} from "@domain/swap/errors"
import { SwapOutChecker } from "@domain/swap"
import { WalletCurrency, ZERO_SATS } from "@domain/shared"

import { baseLogger } from "@services/logger"
import { LoopService } from "@services/loopd"
import { lndsBalances } from "@services/lnd/utils"

describe("Swap", () => {
  const activeLoopd = getActiveLoopd()
  const swapService = LoopService(activeLoopd ?? lnd1LoopConfig())
  const amount: BtcPaymentAmount = { amount: 250000n, currency: WalletCurrency.Btc }

  it("Swap out app returns a SwapOutResult or NoSwapAction", async () => {
    const isSwapServerUp = await swapService.healthCheck()
    if (isSwapServerUp) {
      const swapResult = await swapOut()
      if (swapResult instanceof Error) throw swapResult
      expect(swapResult).not.toBeInstanceOf(Error)
      if (swapResult.noOp) {
        expect(swapResult.noOp).toBe(true)
      } else {
        expect(swapResult).toEqual(
          expect.objectContaining({
            swapId: expect.any(String),
          }),
        )
      }
    }
  })

  it("Swap out for default active loop node or lnd1-loop node returns successful swap result ", async () => {
    const isSwapServerUp = await swapService.healthCheck()
    if (isSwapServerUp) {
      const swapDestAddress = await getSwapDestAddress()
      if (swapDestAddress instanceof Error) return swapDestAddress
      const swapResult = await swapService.swapOut({ amount, swapDestAddress })
      if (swapResult instanceof SwapClientNotResponding) {
        baseLogger.info("Swap Client is not running, skipping")
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

  it("Swap out for lnd2-loop node returns successful swap result or error if not enough funds", async () => {
    const isSwapServerUp = await swapService.healthCheck()
    if (isSwapServerUp) {
      const loopService = LoopService(lnd2LoopConfig())
      const swapServiceLnd2 = loopService
      const isSwapServerUp2 = await swapServiceLnd2.healthCheck()
      if (isSwapServerUp2) {
        const swapDestAddress = await getSwapDestAddress()
        if (swapDestAddress instanceof Error) return swapDestAddress
        // this might fail in not enough funds in LND2 in regtest
        const swapResult = await swapServiceLnd2.swapOut({ amount, swapDestAddress })
        if (swapResult instanceof SwapClientNotResponding) {
          baseLogger.info("Swap Client is not running, skipping")
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
    if (isSwapServerUp) {
      const btc = { amount: 5_000_000_000n, currency: WalletCurrency.Btc }
      const swapResult = await swapService.swapOut({ amount: btc })
      if (swapResult instanceof SwapClientNotResponding) {
        return
      }
      expect(swapResult).toBeInstanceOf(Error)
    }
  })

  it("Swap out if on chain wallet is depleted returns a swap result", async () => {
    const isSwapServerUp = await swapService.healthCheck()
    if (isSwapServerUp) {
      // thresholds
      const { onChain } = await lndsBalances()
      const loopOutWhenHotWalletLessThanConfig = {
        amount: BigInt(onChain + 50000),
        currency: WalletCurrency.Btc,
      }

      // check if wallet is depleted
      const swapOutChecker = SwapOutChecker({
        loopOutWhenHotWalletLessThanConfig,
        swapOutAmount: amount,
      })
      const amountToSwapOut = swapOutChecker.getSwapOutAmount({
        currentOnChainHotWalletBalance: ZERO_SATS,
        currentOutboundLiquidityBalance: ZERO_SATS,
      })
      if (amountToSwapOut.amount > 0) {
        const swapResult = await swapService.swapOut({ amount: amountToSwapOut })
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
    if (isSwapServerUp) {
      const btc: BtcPaymentAmount = { amount: 250000n, currency: WalletCurrency.Btc }
      const quoteResult = await swapService.swapOutQuote(btc)
      if (quoteResult instanceof Error) throw quoteResult
      expect(quoteResult).not.toBeInstanceOf(Error)
      expect(quoteResult.swapFeeSat).toBeDefined()
    }
  })

  it("Swap out terms return terms result", async () => {
    const isSwapServerUp = await swapService.healthCheck()
    if (isSwapServerUp) {
      const termsResult = await swapService.swapOutTerms()
      if (termsResult instanceof Error) throw termsResult
      expect(termsResult).not.toBeInstanceOf(Error)
      expect(termsResult.maxSwapAmount).toBeDefined()
    }
  })
})
