import { MEMO_SHARING_SATS_THRESHOLD } from "@config/app"
import { ledgerToWalletTransactions, translateDescription } from "@domain/ledger/transaction-translation"
import { toSats } from "@domain/primitives/btc"

describe("ledgerToWalletTransactions", () => {
  it("translates ledger txs to wallet txs", () => {
    const ledgerTransactions: LedgerTransaction[] = [
      {
        id: "id" as LedgerTransactionId,
        type: "invoice",
        username: "username" as Username,
        debit: toSats(0),
        credit: toSats(MEMO_SHARING_SATS_THRESHOLD),
        currency: "BTC",
        memoFromPayer: "SomeMemo",
      },
    ]
    const result = ledgerToWalletTransactions(ledgerTransactions)
    const expected = [
      {
        id: "id" as LedgerTransactionId,
        description: "SomeMemo",
      },
    ]
    expect(result).toEqual(expected)
  })
})

describe("translateDescription", () => {
  it("returns the memoFromPayer",() => {
    const result = translateDescription({memoFromPayer: "some memo", credit: MEMO_SHARING_SATS_THRESHOLD, type: "invoice"})
    expect(result).toEqual("some memo")
  })

  it("returns memo if there is no memoFromPayer", () => {
    const result = translateDescription({memo: "some memo", credit: MEMO_SHARING_SATS_THRESHOLD, type: "invoice"})
    expect(result).toEqual("some memo")
  })

  it("returns username description for any amount", () => {
    const result = translateDescription({username: "username", credit: MEMO_SHARING_SATS_THRESHOLD - 1, type: "invoice"})
    expect(result).toEqual("from username")
  })


  it("defaults to type under spam threshold", () => {
    const result = translateDescription({memoFromPayer: "some memo", credit: 1, type: "invoice"})
    expect(result).toEqual("invoice")
  })

  it("returns memo for debit", () => {
    const result = translateDescription({memoFromPayer: "some memo", credit: 0, type: "invoice"})
    expect(result).toEqual("some memo")
  })
})
