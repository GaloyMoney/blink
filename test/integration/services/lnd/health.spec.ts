import moment from "moment"
import { isUp, lndStatusEvent } from "@services/lnd/health"
import { params } from "@services/lnd/auth"
import { baseLogger } from "@services/logger"

beforeAll(done => {
  done()
})

afterAll(done => {
  done()
})

describe("lndHealth", () => {
  // this is a test health checks on lnd
  it('should emit on started', function(){
    let eventFired = true
    setTimeout(function () {
      expect(eventFired).toBeTruthy()
    }, 500); //timeout with an error in one second
    lndStatusEvent.on("started", ({ lnd, pubkey, socket, type }) => {
      eventFired = true
    });
    isUp(params[0])
  });
})
