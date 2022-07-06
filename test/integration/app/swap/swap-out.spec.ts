import { SwapService } from "@services/swap"

import { toSats } from "@domain/bitcoin"

import { lndsBalances } from "@services/lnd/utils"
import { getSwapConfig } from "@config"
import { SwapClientNotResponding } from "@domain/swap/errors"

describe("Swap", () => {
  it("Swap out returns successful SwapResult", async () => {
    const swapResult = await SwapService.swapOut(toSats(500000))
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
  })

  it("Swap out without enough funds returns an Error", async () => {
    const swapResult = await SwapService.swapOut(toSats(5000000000))
    if (swapResult instanceof SwapClientNotResponding) {
      return
    }
    expect(swapResult).toBeInstanceOf(Error)
  })

  it("Swap out if some threshheld it met", async () => {
    const { onChain } = await lndsBalances()
    // @todo should get the average outbound liquity per channel and do something with min outbound liquidty???
    const minOnChainBalance = getSwapConfig().minOutboundLiquidityBalance
    let swapResult
    if (onChain < minOnChainBalance) {
      const swapOutAmount = getSwapConfig().swapOutAmount
      swapResult = await SwapService.swapOut(toSats(swapOutAmount))
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
  })
})
