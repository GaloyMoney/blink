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

    lndStatusEvent.on("started", handler)
    await isUp(node)

    expect(handler).toBeCalledTimes(1)

    lndStatusEvent.removeAllListeners()
  })
})
