import { btc2sat, sat2btc, isInvoiceAlreadyPaidError } from "../utils"
import { lndOutside1, lndOutside2 } from "./helper"
import { createInvoice, pay } from "lightning"

jest.mock("../realtimePrice")

it("btc2sat", async () => {
  const BTC = 1.2
  expect(btc2sat(BTC)).toEqual(120000000)
})

it("sat2btc", async () => {
  const sat = 120000000
  expect(sat2btc(sat)).toEqual(1.2)
})

it("decodes lnservice error correctly", async () => {
  const { request } = await createInvoice({ lnd: lndOutside2, tokens: 1000 })
  await pay({ lnd: lndOutside1, request })
  try {
    await pay({ lnd: lndOutside1, request })
  } catch (err) {
    expect(isInvoiceAlreadyPaidError(err)).toBeTruthy()
  }
})
