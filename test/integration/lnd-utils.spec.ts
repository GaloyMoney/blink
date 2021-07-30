import moment from "moment"
import { getBankOwnerBalance } from "src/ledger"
import { getInvoiceAttempt, updateRoutingFees } from "src/lndUtils"
import { baseLogger } from "src/logger"
import { sleep } from "src/utils"
import {
  cancelHodlInvoice,
  createInvoice,
  getForwards,
  lnd1,
  lndOutside1,
  lndOutside2,
  pay,
  subscribeToInvoice,
  waitFor,
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

    const { id } = await createInvoice({ lnd, tokens: 10000, expires_at })

    {
      const invoice = await getInvoiceAttempt({ lnd, id })
      expect(invoice).toBeTruthy()
    }

    let isCanceled = false
    const sub = subscribeToInvoice({ lnd, id })
    sub.on("invoice_updated", async (invoice) => {
      await sleep(1000)
      isCanceled = invoice.is_canceled
    })

    await waitFor(() => isCanceled)

    sub.removeAllListeners()

    {
      const invoice = await getInvoiceAttempt({ lnd, id })
      expect(invoice).toBeNull()
    }
  })

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

    const balance = await getBankOwnerBalance()

    // this fix lnd rounding issues
    expect([1, 1.01]).toContain(balance)
  })
})
