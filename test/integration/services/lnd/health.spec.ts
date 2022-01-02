import { isUp, lndStatusEvent } from "@services/lnd/health"
import { params } from "@services/lnd/unauth"

import { clearAccountLocks } from "test/helpers/redis"

beforeAll(async () => {
  await clearAccountLocks()
})

describe("lndHealth", () => {
  // this is a test health checks on lnd
  it("should emit on started", async () => {
    const handler = jest.fn()
    const node = params[0]
    node.active = false

    lndStatusEvent.on("started", handler)
    await isUp(node)
    lndStatusEvent.removeAllListeners()

    expect(handler).toBeCalledTimes(1)

    const { active, lnd, type } = handler.mock.calls[0][0]
    expect(active).toBe(true)
    expect(type).toStrictEqual(["offchain", "onchain"])
    // validates if it is an authenticated lnd
    expect(lnd.unlocker).toBeUndefined()
    expect(lnd.wallet).toBeDefined()
  })
})
