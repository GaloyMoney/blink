import { cancelHodlInvoice } from "lightning"
import moment from "moment"
import { bankOwnerMediciPath } from "src/ledger/ledger"
import { getInvoiceAttempt, updateRoutingFees } from "src/lndUtils"
import { baseLogger } from "src/logger"
import { MainBook } from "src/mongodb"
import { sleep } from "src/utils"
import {
  createInvoice,
  getForwards,
  lnd1,
  lndOutside1,
  lndOutside2,
  pay,
  waitFor
} from "test/helpers"

afterAll(() => {
  jest.restoreAllMocks()
})

describe("lndUtils", () => {
  // this is a test for gc-canceled-invoices-on-the-fly=true settings
  it("test cancelling invoice effect", async () => {
    const lnd = lndOutside2

    const { id } = await createInvoice({ lnd, tokens: 10000 })

    {
      const invoice = await getInvoiceAttempt({ lnd, id })
      expect(invoice).toBeTruthy()
    }

    await cancelHodlInvoice({ lnd, id })

    {
      const invoice = await getInvoiceAttempt({ lnd, id })
      expect(invoice).toBeNull()
    }
  })

  it("test expiring invoice effect", async () => {
    const lnd = lndOutside2

    const expires_at = moment().add(1, "s").toISOString()

    const { id } = await createInvoice({ lnd: lndOutside2, tokens: 10000, expires_at })

    {
      const invoice = await getInvoiceAttempt({ lnd, id })
      expect(invoice).toBeTruthy()
    }

    await sleep(1000)

    {
      const invoice = await getInvoiceAttempt({ lnd, id })
      expect(invoice).toBeNull()
    }
  })

  it("sets routing fee correctly", async () => {
    const bankOwnerPath = await bankOwnerMediciPath()

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

    const { balance } = await MainBook.balance({
      accounts: bankOwnerPath,
    })

    // this fix lnd rounding issues
    expect([1, 1.01]).toContain(balance)
  })
})
