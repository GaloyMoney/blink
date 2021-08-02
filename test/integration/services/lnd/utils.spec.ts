import moment from "moment"
import { getInvoiceAttempt, updateRoutingFees } from "@services/lnd/utils"
import { baseLogger } from "@services/logger"
import { ledger } from "@services/mongodb"
import { sleep } from "@core/utils"
import { DbMetadata } from "@services/mongoose/schema"
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

    const initBalance = await ledger.getBankOwnerBalance()

    await waitFor(async () => {
      try {
        return await pay({ lnd: lndOutside1, request })
      } catch (error) {
        baseLogger.warn({ error }, "pay failed. trying again.")
        return null
      }
    })

    const date = Date.now() + 60 * 60 * 1000 * 24 * 2
    jest.spyOn(global.Date, "now").mockImplementation(() => new Date(date).valueOf())

    const startDate = new Date(0)
    startDate.setUTCHours(0, 0, 0, 0)

    const endDate = new Date(Date.now() - 864e5)
    endDate.setUTCHours(0, 0, 0, 0)

    const after = startDate.toISOString()
    const before = endDate.toISOString()

    const totalFees = (await getForwards({ lnd: lnd1, after, before })).forwards
      .map((f) => Number(f.fee_mtokens))
      .reduce((acc, val) => acc + val)

    baseLogger.debug(
      (await getForwards({ lnd: lnd1, after, before })).forwards,
      "forwards",
    )

    await DbMetadata.findOneAndUpdate(
      {},
      { $set: { routingFeeLastEntry: null } },
      { upsert: true },
    )

    await updateRoutingFees()

    const endBalance = await ledger.getBankOwnerBalance()

    expect((endBalance - initBalance) * 1000).toBeCloseTo(totalFees, 0)
  })
})
