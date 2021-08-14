import { MEMO_SHARING_SATS_THRESHOLD } from "@config/app"
import { LedgerTransactionType } from "@domain/ledger"
import { SettlementMethod } from "@domain/wallets"
import {
  WalletTransactionHistory,
  translateDescription,
} from "@domain/wallets/tx-history"
import { toSats } from "@domain/bitcoin"

describe("WalletTransactionHistory.confirmed", () => {
  it("translates ledger txs to wallet txs", () => {
    const timestamp = new Date(Date.now())
    const ledgerTransactions: LedgerTransaction[] = [
      {
        id: "id" as LedgerTransactionId,
        type: LedgerTransactionType.Invoice,
        paymentHash: "paymentHash" as PaymentHash,
        debit: toSats(0),
        fee: toSats(0),
        credit: toSats(100000),
        usd: 10,
        feeUsd: 0.1,
        currency: "BTC",
        memoFromPayer: "SomeMemo",
        pendingConfirmation: false,
        timestamp,
        // To test that the lightning detection logic
        // works when key is present
        addresses: [],
      },
      {
        id: "id" as LedgerTransactionId,
        type: LedgerTransactionType.IntraLedger,
        paymentHash: "paymentHash" as PaymentHash,
        username: "username" as Username,
        debit: toSats(0),
        fee: toSats(0),
        credit: toSats(100000),
        usd: 10,
        feeUsd: 0.1,
        currency: "BTC",
        pendingConfirmation: false,
        timestamp,
      },
      {
        id: "id" as LedgerTransactionId,
        type: LedgerTransactionType.OnchainIntraLedger,
        addresses: ["address" as OnChainAddress],
        paymentHash: "paymentHash" as PaymentHash,
        debit: toSats(0),
        fee: toSats(0),
        credit: toSats(100000),
        usd: 10,
        feeUsd: 0.1,
        currency: "BTC",
        pendingConfirmation: false,
        timestamp,
      },
      {
        id: "id" as LedgerTransactionId,
        type: LedgerTransactionType.OnchainReceipt,
        debit: toSats(0),
        fee: toSats(0),
        credit: toSats(100000),
        usd: 10,
        feeUsd: 0.1,
        currency: "BTC",
        pendingConfirmation: false,
        timestamp,
        addresses: ["address" as OnChainAddress],
      },
    ]
    const result = WalletTransactionHistory.confirmed(ledgerTransactions)
    const expected = [
      {
        id: "id" as LedgerTransactionId,
        settlementVia: SettlementMethod.Lightning,
        settlementAmount: toSats(100000),
        settlementFee: toSats(0),
        paymentHash: "paymentHash" as PaymentHash,
        old: {
          description: "SomeMemo",
          usd: 10,
          feeUsd: 0.1,
          type: LedgerTransactionType.Invoice,
        },
        pendingConfirmation: false,
        createdAt: timestamp,
      },
      {
        id: "id" as LedgerTransactionId,
        settlementVia: SettlementMethod.IntraLedger,
        recipientId: "username",
        settlementAmount: toSats(100000),
        settlementFee: toSats(0),
        paymentHash: "paymentHash" as PaymentHash,
        old: {
          description: "from username",
          usd: 10,
          feeUsd: 0.1,
          type: LedgerTransactionType.IntraLedger,
        },
        addresses: null,
        pendingConfirmation: false,
        createdAt: timestamp,
      },
      {
        id: "id" as LedgerTransactionId,
        settlementVia: SettlementMethod.IntraLedger,
        settlementAmount: toSats(100000),
        settlementFee: toSats(0),
        recipientId: null,
        paymentHash: null,
        old: {
          description: "onchain_on_us",
          usd: 10,
          feeUsd: 0.1,
          type: LedgerTransactionType.OnchainIntraLedger,
        },
        addresses: ["address" as OnChainAddress],
        pendingConfirmation: false,
        createdAt: timestamp,
      },
      {
        id: "id" as LedgerTransactionId,
        settlementVia: SettlementMethod.OnChain,
        settlementAmount: toSats(100000),
        settlementFee: toSats(0),
        old: {
          description: "onchain_receipt",
          usd: 10,
          feeUsd: 0.1,
          type: LedgerTransactionType.OnchainReceipt,
        },
        pendingConfirmation: false,
        createdAt: timestamp,
        addresses: ["address" as OnChainAddress],
      },
    ]
    expect(result.transactions).toEqual(expected)
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

describe("ConfirmedTransactionHistory.addPendingIncoming", () => {
  it("translates submitted txs to wallet txs", () => {
    const timestamp = new Date(Date.now())
    const submittedTransactions: SubmittedTransaction[] = [
      {
        confirmations: 1,
        fee: toSats(1000),
        id: "id" as TxId,
        outputAddresses: ["userAddress1", "userAddress2", "address3"] as OnChainAddress[],
        tokens: toSats(100000),
        rawTx: {
          id: "id" as TxId,
          outs: [
            {
              sats: toSats(25000),
              n: 0,
              address: "userAddress1" as OnChainAddress,
            },
            {
              sats: toSats(50000),
              n: 1,
              address: "userAddress2" as OnChainAddress,
            },
            {
              sats: toSats(25000),
              n: 1,
              address: "address3" as OnChainAddress,
            },
          ],
        },
        createdAt: timestamp,
      },
    ]
    const history = WalletTransactionHistory.confirmed([])
    const addresses = ["userAddress1", "userAddress2"] as OnChainAddress[]
    const result = history.addPendingIncoming(submittedTransactions, addresses, 1)
    const expected = [
      {
        id: "id" as TxId,
        settlementVia: "onchain",
        settlementAmount: toSats(25000),
        settlementFee: toSats(0),
        old: {
          description: "pending",
          usd: 25000,
          feeUsd: 0,
          type: LedgerTransactionType.OnchainReceipt,
        },
        pendingConfirmation: true,
        createdAt: timestamp,
        addresses: ["userAddress1" as OnChainAddress],
      },
      {
        id: "id" as TxId,
        settlementVia: "onchain",
        settlementAmount: toSats(50000),
        settlementFee: toSats(0),
        old: {
          description: "pending",
          usd: 50000,
          feeUsd: 0,
          type: LedgerTransactionType.OnchainReceipt,
        },
        pendingConfirmation: true,
        createdAt: timestamp,
        addresses: ["userAddress2" as OnChainAddress],
      },
    ]
    expect(result.transactions).toEqual(expected)
  })
})
