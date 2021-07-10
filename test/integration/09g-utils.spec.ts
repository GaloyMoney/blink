import { isInvoiceAlreadyPaidError } from "src/utils"
import { lndOutside1, lndOutside2 } from "./helper"
import { createInvoice, pay } from "lightning"

jest.mock("src/realtimePrice", () => require("../mocks/realtimePrice"))

it("decodes lnservice error correctly", async () => {
  const { request } = await createInvoice({ lnd: lndOutside2, tokens: 1000 })
  await pay({ lnd: lndOutside1, request })
  try {
    await pay({ lnd: lndOutside1, request })
  } catch (err) {
    expect(isInvoiceAlreadyPaidError(err)).toBeTruthy()
  }
})
