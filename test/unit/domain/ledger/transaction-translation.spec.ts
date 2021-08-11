import moment from "moment"

import { MEMO_SHARING_SATS_THRESHOLD } from "@config/app"
import {
  ledgerToWalletTransactions,
  translateDescription,
} from "@domain/ledger/transaction-translation"
import { toSats } from "@domain/bitcoin"

describe("ledgerToWalletTransactions", () => {
  it("translates ledger txs to wallet txs", () => {
    const timestamp = new Date(Date.now())
    const ledgerTransactions: LedgerTransaction[] = [
      {
        id: "id" as LedgerTransactionId,
        type: "invoice" as LedgerTransactionType,
        paymentHash: "paymentHash" as PaymentHash,
        debit: toSats(0),
        fee: toSats(0),
        credit: toSats(100000),
        currency: "BTC",
        memoFromPayer: "SomeMemo",
        pendingConfirmation: false,
        timestamp,
      },
      {
        id: "id" as LedgerTransactionId,
        type: "on_us" as LedgerTransactionType,
        username: "username" as Username,
        debit: toSats(0),
        fee: toSats(0),
        credit: toSats(100000),
        currency: "BTC",
        pendingConfirmation: false,
        timestamp,
      },
      {
        id: "id" as LedgerTransactionId,
        type: "onchain_receipt" as LedgerTransactionType,
        debit: toSats(0),
        fee: toSats(0),
        credit: toSats(100000),
        currency: "BTC",
        pendingConfirmation: false,
        timestamp,
        addresses: ["address" as OnChainAddress],
      },
    ]
    const result = ledgerToWalletTransactions(ledgerTransactions)
    const expected = [
      {
        id: "id" as LedgerTransactionId,
        settlementVia: "lightning",
        settlementAmount: toSats(100000),
        settlementFee: toSats(0),
        paymentHash: "paymentHash" as PaymentHash,
        description: "SomeMemo",
        pendingConfirmation: false,
        createdAt: timestamp,
      },
      {
        id: "id" as LedgerTransactionId,
        settlementVia: "intraledger",
        recipientId: "username",
        settlementAmount: toSats(100000),
        settlementFee: toSats(0),
        description: "from username",
        pendingConfirmation: false,
        createdAt: timestamp,
      },
      {
        id: "id" as LedgerTransactionId,
        settlementVia: "onchain",
        settlementAmount: toSats(100000),
        settlementFee: toSats(0),
        description: "onchain_receipt",
        pendingConfirmation: false,
        createdAt: timestamp,
        addresses: ["address" as OnChainAddress],
      },
    ]
    expect(result).toEqual(expected)
  })
})

describe("translateDescription", () => {
  it("returns the memoFromPayer", () => {
    const result = translateDescription({
      memoFromPayer: "some memo",
      credit: MEMO_SHARING_SATS_THRESHOLD,
      type: "invoice",
    })
    expect(result).toEqual("some memo")
  })

  it("returns memo if there is no memoFromPayer", () => {
    const result = translateDescription({
      lnMemo: "some memo",
      credit: MEMO_SHARING_SATS_THRESHOLD,
      type: "invoice",
    })
    expect(result).toEqual("some memo")
  })

  it("returns username description for any amount", () => {
    const result = translateDescription({
      username: "username",
      credit: MEMO_SHARING_SATS_THRESHOLD - 1,
      type: "invoice",
    })
    expect(result).toEqual("from username")
  })

  it("defaults to type under spam threshold", () => {
    const result = translateDescription({
      memoFromPayer: "some memo",
      credit: 1,
      type: "invoice",
    })
    expect(result).toEqual("invoice")
  })

  it("returns memo for debit", () => {
    const result = translateDescription({
      memoFromPayer: "some memo",
      credit: 0,
      type: "invoice",
    })
    expect(result).toEqual("some memo")
  })
})
