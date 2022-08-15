import { getActiveLnd } from "@services/lnd/utils"
import { rebalancingInternalChannels } from "@services/lnd/utils-bos"

import {
  defaultStateConfig,
  getChannels,
  initializeTestingState,
  waitUntilChannelBalanceSync,
} from "test/helpers"

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
    await rebalancingInternalChannels()

    const activeLnd = getActiveLnd()
    if (activeLnd instanceof Error) throw activeLnd

    await waitUntilChannelBalanceSync({ lnd: activeLnd.lnd })

    const { channels } = await getChannels({ lnd: activeLnd.lnd })
    const channel = channels.filter((channel) => channel.local_balance === 500_000)
    expect(channel.length).toBe(1)
    expect(channel[0].local_balance).toBe(500_000)
  })
})
