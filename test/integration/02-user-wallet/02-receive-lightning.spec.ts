import { ledger } from "@services/mongodb"
import { getHash } from "@core/utils"
import { checkIsBalanced, getUserWallet, lndOutside1, pay } from "test/helpers"
import { MEMO_SHARING_SATS_THRESHOLD } from "@config/app"

jest.mock("@services/realtime-price", () => require("test/mocks/realtime-price"))
jest.mock("@services/phone-provider", () => require("test/mocks/phone-provider"))

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

    const dbTx = await ledger.getTransactionByHash(hash)
    expect(dbTx.sats).toBe(sats)
    expect(dbTx.memo).toBe(memo)
    expect(dbTx.pending).toBe(false)

    // check that memo is not filtered by spam filter
    const txns = await userWallet1.getTransactions()
    const noSpamTxn = txns.find((txn) => txn.hash === hash)
    expect(noSpamTxn.description).toBe(memo)

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

    const dbTx = await ledger.getTransactionByHash(hash)
    expect(dbTx.sats).toBe(sats)
    expect(dbTx.memo).toBe("")
    expect(dbTx.pending).toBe(false)

    const { BTC: finalBalance } = await userWallet1.getBalances()
    expect(finalBalance).toBe(initBalance1 + sats)
  })

  it("receives spam invoice", async () => {
    // amount below MEMO_SPAM threshold
    const sats = 100
    const memo = "THIS MIGHT BE SPAM!!!"

    // confirm that transaction should be filtered
    expect(sats).toBeLessThan(MEMO_SHARING_SATS_THRESHOLD)

    // process spam transaction
    const invoice = await userWallet1.addInvoice({ value: sats, memo })
    const hash = getHash(invoice)
    await pay({ lnd: lndOutside1, request: invoice })
    expect(await userWallet1.updatePendingInvoice({ hash })).toBeTruthy()

    // check that spam memo is persisted to database
    const dbTx = await ledger.getTransactionByHash(hash)
    expect(dbTx.memo).toBe(memo)

    // check that spam memo is filtered from transaction description
    const txns = await userWallet1.getTransactions()
    const spamTxn = txns.find((txn) => txn.hash === hash)
    expect(dbTx.type).toBe("invoice")
    expect(spamTxn.description).toBe(dbTx.type)

    // confirm expected final balance
    const { BTC: finalBalance } = await userWallet1.getBalances()
    expect(finalBalance).toBe(initBalance1 + sats)
  })
})
