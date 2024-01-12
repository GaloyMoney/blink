import { MS_PER_DAY, ONE_DAY } from "@/config"
import { updateRoutingRevenues } from "@/services/lnd/utils"
import { baseLogger } from "@/services/logger"
import { ledgerAdmin } from "@/services/mongodb"
import { DbMetadata } from "@/services/mongoose/schema"

import { timestampDaysAgo } from "@/utils"

import {
  clearAccountLocks,
  createInvoice,
  getForwards,
  lnd1,
  lndOutside1,
  lndOutside2,
  pay,
  waitFor,
} from "test/helpers"

beforeAll(async () => {
  await clearAccountLocks()
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe("lndUtils", () => {
  it.skip("sets routing fee correctly", async () => {
    // Skipped because this test is already broken. lndOutside1 and lndOutside2
    // are directly connected and routing fees are 0.

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
})
