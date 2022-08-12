import { rebalancingInternalChannels } from "@services/lnd/utils-bos"
import { baseLogger } from "@services/logger"
import { sleep } from "@utils"

import { initializeTestingState, defaultStateConfig } from "test/helpers"

beforeAll(async () => {
  await initializeTestingState(defaultStateConfig())
})

beforeEach(() => {
  jest.resetAllMocks()
})

afterAll(async () => {
  jest.restoreAllMocks()
})

describe("test internal cron functions individually", () => {
  it("rebalancingInternalChannelsTest", async () => {
    try {
      await sleep(5000)
      await rebalancingInternalChannels()
    } catch (err) {
      baseLogger.warn({ err }, "err123")
    }
  })
})
