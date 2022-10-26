import { handleSwapOutCompleted } from "@app/swap"
import { lnd1LoopConfig } from "@app/swap/get-active-loopd"
import { WalletCurrency } from "@domain/shared"
import { LoopService } from "@services/loopd"
import { sleep } from "@utils"

import { mineBlockAndSyncAll } from "test/helpers"

describe("Swap", () => {
  it("Initiate Swap out, then listen for events", async () => {
    const amount = { amount: BigInt(250000), currency: WalletCurrency.Btc }
    const swapService = LoopService(lnd1LoopConfig())
    const isSwapServerUp = await swapService.healthCheck()
    if (isSwapServerUp) {
      await new Promise(async (resolve) => {
        // 1) Start Swap Listener
        const listener = swapService.swapListener()
        listener.on("data", async (response) => {
          await handleSwapOutCompleted(response)
          expect(response).toBeDefined()
          resolve(true)
        })
        // 2) Trigger Swap Out
        await swapService.swapOut({ amount })
        await sleep(1000)
        // 3) Mine blocks and wait a few seconds between rounds
        await mineBlockAndSyncAll()
        await sleep(1000)
        await mineBlockAndSyncAll()
        await sleep(1000)
        await mineBlockAndSyncAll()
        // 4) The swap out should have been picked up by the listener by now
        // and triggered the handleSwapOutCompleted above
        // 5) Cancel the listener
        listener.cancel()
        expect.assertions(1)
        resolve(true)
      })
    } else {
      const msg = "Swap Server not running...skipping"
      expect(msg).toEqual(msg)
    }
  })
})
