import { MainBook } from "src/mongodb"
import { baseLogger } from "src/logger"
import { updateRoutingFees } from "src/lndUtils"
import { bankOwnerMediciPath } from "src/ledger/ledger"
import {
  createInvoice,
  getForwards,
  lnd1,
  lndOutside1,
  lndOutside2,
  pay,
  waitFor,
} from "test/helpers"

afterAll(() => {
  jest.restoreAllMocks()
})

describe("lndUtils", () => {
  describe("updateRoutingFees", () => {
    it("sets routing fee correctly", async () => {
      const { request } = await createInvoice({ lnd: lndOutside2, tokens: 10000 })

      await waitFor(async () => {
        try {
          return await pay({ lnd: lndOutside1, request })
        } catch (error) {
          baseLogger.warn({ error }, "pay failed. trying again.")
          return null
        }
      })

      baseLogger.debug((await getForwards({ lnd: lnd1 })).forwards, "forwards")

      const date = Date.now() + 60 * 60 * 1000 * 24 * 2
      jest.spyOn(global.Date, "now").mockImplementation(() => new Date(date).valueOf())

      await updateRoutingFees()

      const bankOwnerPath = await bankOwnerMediciPath()

      // FIXME: may not be indempotant. should have a diff of balance instead.
      const { balance } = await MainBook.balance({
        accounts: bankOwnerPath,
      })

      // this fix lnd rounding issues
      expect([1, 1.01]).toContain(balance)
    })
  })
})
