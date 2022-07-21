import { handleSwapOutCompleted } from "@app/swap"
import { toSats } from "@domain/bitcoin"
import { SwapService } from "@services/swap"
import { sleep } from "@utils"

import { mineBlockAndSyncAll } from "test/helpers"

describe("Swap", () => {
  jest.setTimeout(30000)
  const amount = 250000
  it("Initiate Swap out, then listen for events", async () => {
    const swapService = SwapService()
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
        await swapService.swapOut(toSats(amount))
        await sleep(1000)
        // 3) Mine blocks
        await mineBlockAndSyncAll()
        // 4) Wait a few seconds
        await sleep(2000)
        // 5) Cancel listencer
        listener.cancel()
        expect.assertions(1)
        resolve(true)
      })
    } else {
      const msg = "Swap Server not running...skipping"
      // console.log(msg)
      expect(msg).toEqual(msg)
    }
  })
})
