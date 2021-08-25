import { isUp, lndStatusEvent } from "@services/lnd/health"
import { params } from "@services/lnd/unauth"

describe("lndHealth", () => {
  // this is a test health checks on lnd
  it("should emit on started", function () {
    let eventFired = false
    setTimeout(function () {
      expect(eventFired).toBe(true)
    }, 1000) //timeout with an error in one second
    lndStatusEvent.on("started", () => {
      eventFired = true
    })
    isUp(params[0])
  })
})
