import { BTC_NETWORK, getSwapConfig } from "@config"

import { Lightning, Swap } from "@app"

import { OnChainService } from "@services/lnd/onchain-service"
import { TxDecoder } from "@domain/bitcoin/onchain"

import { toSats } from "@domain/bitcoin"

import { checkIsBalanced, mineBlockAndSyncAll } from "test/helpers"

// beforeAll(async () => {

// })

// afterEach(async () => {
//   await checkIsBalanced()
// })

describe("Swap", () => {
  it("out returns SwapResult", async () => {
    const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
    if (onChainService instanceof Error) throw onChainService
    await mineBlockAndSyncAll()
    const onChainBalance = await onChainService.getBalance()
    if (onChainBalance instanceof Error) throw onChainBalance
    const lightningBalance = await Lightning.getOnChainBalance()
    const minOnChainBalance = getSwapConfig().minOnChainBalance
    const swapResult = await Swap.swapOut({ amount: toSats(500000) })
    expect(swapResult).not.toBeInstanceOf(Error)
    expect(swapResult).toEqual(
      expect.objectContaining({
        swapId: expect.any(String),
      }),
    )
  })
})
