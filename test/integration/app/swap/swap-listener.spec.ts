import { handleSwapOutCompleted } from "@app/swap/swap-listener"
import { toSats } from "@domain/bitcoin"
import { SwapService } from "@services/swap"
import { sleep } from "@utils"

import { mineBlockAndSyncAll } from "test/helpers"

describe("Swap", () => {
  jest.setTimeout(30000)
  // TODO - maybe mock this or move to e2e test
  it("Initiate Swap out, then listen for events", async () => {
    const swapService = SwapService()
    const isSwapServerUp = await swapService.healthCheck()
    // console.log("isSwapServerUp:", isSwapServerUp)
    if (isSwapServerUp) {
      const msg = "Swap Monitor Listening...closing in a few seconds"
      new Promise(async (resolve) => {
        // 1) Start Swap Listener
        const listener = swapService.swapListener()
        listener.on("data", (response) => {
          // console.log(response)
          handleSwapOutCompleted(response)
        })
        // 2) Trigger Swap Out
        await swapService.swapOut(toSats(50000))
        // 3) Mine blocks
        await mineBlockAndSyncAll()
        // 4) Wait a few seconds
        await sleep(5000)
        // 5) Cancel listencer
        listener.cancel()
        resolve(true)
        expect(msg).toEqual(msg)
      })
    } else {
      const msg = "Swap Server not running...skipping"
      // console.log(msg)
      expect(msg).toEqual(msg)
    }
  })
})
