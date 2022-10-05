import { MS_PER_DAY, ONE_DAY } from "@config"
import { deleteExpiredWalletInvoice, updateRoutingRevenues } from "@services/lnd/utils"
import { baseLogger } from "@services/logger"
import { ledgerAdmin } from "@services/mongodb"
import { DbMetadata, WalletInvoice } from "@services/mongoose/schema"

import { sleep, timestampDaysAgo } from "@utils"

import {
  cancelHodlInvoice,
  clearAccountLocks,
  createInvoice,
  getForwards,
  getInvoiceAttempt,
  lnd1,
  lndOutside1,
  lndOutside2,
  pay,
  subscribeToInvoice,
  waitFor,
} from "test/helpers"

beforeAll(async () => {
  await clearAccountLocks()
})

afterEach(() => {
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

    // expire in 1 second
    const expires_at = new Date(Date.now() + 1000).toISOString()

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

    const initBalance = await ledgerAdmin.getBankOwnerBalance()

    await waitFor(async () => {
      try {
        return pay({ lnd: lndOutside1, request })
      } catch (error) {
        baseLogger.warn({ error }, "pay failed. trying again.")
        return null
      }
    })

    const date = Date.now() + MS_PER_DAY * 2
    jest.spyOn(global.Date, "now").mockImplementation(() => new Date(date).valueOf())

    const startDate = new Date(0)
    startDate.setUTCHours(0, 0, 0, 0)

    const endDate = timestampDaysAgo(ONE_DAY)
    if (endDate instanceof Error) return endDate
    endDate.setUTCHours(0, 0, 0, 0)

    const after = startDate.toISOString()
    const before = endDate.toISOString()

    const totalFees = (await getForwards({ lnd: lnd1, after, before })).forwards.reduce(
      (acc, val) => acc + Number(val.fee_mtokens),
      0,
    )

    baseLogger.debug(
      (await getForwards({ lnd: lnd1, after, before })).forwards,
      "forwards",
    )

    await DbMetadata.findOneAndUpdate(
      {},
      { $set: { routingFeeLastEntry: null } },
      { upsert: true },
    )

    await updateRoutingRevenues()

    const endBalance = await ledgerAdmin.getBankOwnerBalance()

    expect((endBalance - initBalance) * 1000).toBeCloseTo(totalFees, 0)
  })

  it("deletes expired WalletInvoice without throw an exception", async () => {
    const delta = 90 // days
    const mockDate = new Date()
    mockDate.setDate(mockDate.getDate() + delta)
    jest.spyOn(global.Date, "now").mockImplementation(() => new Date(mockDate).valueOf())

    const queryDate = new Date(Date.now())
    queryDate.setDate(queryDate.getDate() - delta)

    const invoicesCount = await WalletInvoice.countDocuments({
      timestamp: { $lt: queryDate },
      paid: false,
    })
    const result = await deleteExpiredWalletInvoice()
    expect(result).toBe(invoicesCount)
  })
})
