import { MainBook } from "src/mongodb"
import { baseLogger } from "src/logger"
import { updateRoutingFees } from "src/lndUtils"
import { revenueFeePath } from "src/ledger/ledger"
import {
  createInvoice,
  getForwards,
  lnd1,
  lndOutside1,
  lndOutside2,
  pay,
} from "test/helpers"

afterAll(async () => {
  jest.restoreAllMocks()
})

describe("lndUtils", () => {
  describe("updateRoutingFees", () => {
    it("sets routing fee correctly", async () => {
      const { request } = await createInvoice({ lnd: lndOutside2, tokens: 10000 })
      await pay({ lnd: lndOutside1, request })

      baseLogger.debug((await getForwards({ lnd: lnd1 })).forwards, "forwards")

      const date = Date.now() + 60 * 60 * 1000 * 24 * 2
      jest.spyOn(global.Date, "now").mockImplementation(() => new Date(date).valueOf())

      await updateRoutingFees()

      const { balance } = await MainBook.balance({
        accounts: revenueFeePath,
      })

      // this fix lnd rounding issues
      expect([1, 1.01]).toContain(balance)
    })
  })
})
