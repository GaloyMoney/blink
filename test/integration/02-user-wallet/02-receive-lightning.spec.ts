import { Transaction } from "src/schema"
import { getHash } from "src/utils"
import { checkIsBalanced, getUserWallet, lndOutside1, pay } from "test/helpers"

jest.mock("src/realtimePrice", () => require("test/mocks/realtimePrice"))

let userWallet1
let initBalance1

beforeAll(async () => {
  userWallet1 = await getUserWallet(1)
})

beforeEach(async () => {
  ;({ BTC: initBalance1 } = await userWallet1.getBalances())
})

afterEach(async () => {
  await checkIsBalanced()
})

describe("UserWallet - Lightning", () => {
  it("receives payment from outside", async () => {
    // larger amount to not fall below the escrow limit
    const sats = 50000
    const memo = "myMemo"

    const invoice = await userWallet1.addInvoice({ value: sats, memo })
    const hash = getHash(invoice)

    await pay({ lnd: lndOutside1, request: invoice })

    expect(await userWallet1.updatePendingInvoice({ hash })).toBeTruthy()
    // second request must not throw an exception
    expect(await userWallet1.updatePendingInvoice({ hash })).toBeTruthy()

    const dbTx = await Transaction.findOne({ hash })
    expect(dbTx.sats).toBe(sats)
    expect(dbTx.memo).toBe(memo)
    expect(dbTx.pending).toBe(false)

    const { BTC: finalBalance } = await userWallet1.getBalances()
    expect(finalBalance).toBe(initBalance1 + sats)
  })

  it("receives zero amount invoice", async () => {
    const sats = 1000

    const invoice = await userWallet1.addInvoice({})
    const hash = getHash(invoice)

    await pay({ lnd: lndOutside1, request: invoice, tokens: sats })

    expect(await userWallet1.updatePendingInvoice({ hash })).toBeTruthy()
    // second request must not throw an exception
    expect(await userWallet1.updatePendingInvoice({ hash })).toBeTruthy()

    const dbTx = await Transaction.findOne({ hash })
    expect(dbTx.sats).toBe(sats)
    expect(dbTx.memo).toBe("")
    expect(dbTx.pending).toBe(false)

    const { BTC: finalBalance } = await userWallet1.getBalances()
    expect(finalBalance).toBe(initBalance1 + sats)
  })
})
