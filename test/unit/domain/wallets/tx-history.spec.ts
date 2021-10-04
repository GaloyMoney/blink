import { MEMO_SHARING_SATS_THRESHOLD } from "@config/app"
import { LedgerTransactionType } from "@domain/ledger"
import { SettlementMethod, PaymentInitiationMethod, TxStatus } from "@domain/wallets"
import {
  WalletTransactionHistory,
  translateDescription,
} from "@domain/wallets/tx-history"
import { toSats } from "@domain/bitcoin"
import { SubmittedTransaction } from "@domain/bitcoin/onchain"

describe("WalletTransactionHistory.fromLedger", () => {
  it("translates ledger txs to wallet txs", () => {
    const timestamp = new Date(Date.now())
    const ledgerTransactions: LedgerTransaction[] = [
      {
        id: "id" as LedgerTransactionId,
        walletId: "walletId" as WalletId,
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
        journalId: "journalId" as LedgerJournalId,
        timestamp,
        // To test that the lightning detection logic
        // works when key is present
        addresses: [],
        feeKnownInAdvance: false,
      },
      {
        id: "id" as LedgerTransactionId,
        walletId: "walletId" as WalletId,
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
        journalId: "journalId" as LedgerJournalId,
        timestamp,
        feeKnownInAdvance: false,
      },
      {
        id: "id" as LedgerTransactionId,
        walletId: "walletId" as WalletId,
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
        journalId: "journalId" as LedgerJournalId,
        timestamp,
        feeKnownInAdvance: false,
      },
      {
        id: "id" as LedgerTransactionId,
        walletId: "walletId" as WalletId,
        type: LedgerTransactionType.OnchainReceipt,
        debit: toSats(0),
        fee: toSats(0),
        credit: toSats(100000),
        usd: 10,
        feeUsd: 0.1,
        currency: "BTC",
        pendingConfirmation: false,
        journalId: "journalId" as LedgerJournalId,
        timestamp,
        addresses: ["address" as OnChainAddress],
        feeKnownInAdvance: false,
      },
    ]
    const result = WalletTransactionHistory.fromLedger(ledgerTransactions)
    const expected = [
      {
        id: "id" as LedgerTransactionId,
        walletId: "walletId" as WalletId,
        initiationVia: PaymentInitiationMethod.Lightning,
        settlementVia: SettlementMethod.Lightning,
        settlementAmount: toSats(100000),
        settlementFee: toSats(0),
        paymentHash: "paymentHash" as PaymentHash,
        deprecated: {
          description: "SomeMemo",
          usd: 10,
          feeUsd: 0.1,
          type: LedgerTransactionType.Invoice,
        },
        recipientUsername: null,
        status: TxStatus.Success,
        createdAt: timestamp,
      },
      {
        id: "id" as LedgerTransactionId,
        walletId: "walletId" as WalletId,
        initiationVia: PaymentInitiationMethod.Lightning,
        settlementVia: SettlementMethod.IntraLedger,
        recipientUsername: "username",
        settlementAmount: toSats(100000),
        settlementFee: toSats(0),
        paymentHash: "paymentHash" as PaymentHash,
        deprecated: {
          description: "from username",
          usd: 10,
          feeUsd: 0.1,
          type: LedgerTransactionType.IntraLedger,
        },
        status: TxStatus.Success,
        createdAt: timestamp,
      },
      {
        id: "id" as LedgerTransactionId,
        walletId: "walletId" as WalletId,
        initiationVia: PaymentInitiationMethod.OnChain,
        settlementVia: SettlementMethod.IntraLedger,
        settlementAmount: toSats(100000),
        settlementFee: toSats(0),
        deprecated: {
          description: "onchain_on_us",
          usd: 10,
          feeUsd: 0.1,
          type: LedgerTransactionType.OnchainIntraLedger,
        },
        recipientUsername: null,
        addresses: ["address" as OnChainAddress],
        status: TxStatus.Success,
        createdAt: timestamp,
      },
      {
        id: "id" as LedgerTransactionId,
        walletId: "walletId" as WalletId,
        initiationVia: PaymentInitiationMethod.OnChain,
        settlementVia: SettlementMethod.OnChain,
        settlementAmount: toSats(100000),
        settlementFee: toSats(0),
        deprecated: {
          description: "onchain_receipt",
          usd: 10,
          feeUsd: 0.1,
          type: LedgerTransactionType.OnchainReceipt,
        },
        recipientUsername: null,
        status: TxStatus.Success,
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

  it("defaults to type under spam threshdeprecated", () => {
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
      SubmittedTransaction({
        confirmations: 1,
        fee: toSats(1000),
        rawTx: {
          id: "id" as TxId,
          outs: [
            {
              sats: toSats(25000),
              address: "userAddress1" as OnChainAddress,
            },
            {
              sats: toSats(50000),
              address: "userAddress2" as OnChainAddress,
            },
            {
              sats: toSats(25000),
              address: "address3" as OnChainAddress,
            },
          ],
        },
        createdAt: timestamp,
      }),
    ]
    const history = WalletTransactionHistory.fromLedger([])
    const addresses = ["userAddress1", "userAddress2"] as OnChainAddress[]
    const result = history.addPendingIncoming(
      "walletId" as WalletId,
      submittedTransactions,
      addresses,
      1 as UsdPerSat,
    )
    const expected = [
      {
        id: "id" as TxId,
        walletId: "walletId" as WalletId,
        initiationVia: PaymentInitiationMethod.OnChain,
        settlementVia: "onchain",
        settlementAmount: toSats(25000),
        settlementFee: toSats(0),
        deprecated: {
          description: "pending",
          usd: 25000,
          feeUsd: 0,
          type: LedgerTransactionType.OnchainReceipt,
        },
        recipientUsername: null,
        status: TxStatus.Pending,
        createdAt: timestamp,
        addresses: ["userAddress1" as OnChainAddress],
      },
      {
        id: "id" as TxId,
        walletId: "walletId" as WalletId,
        initiationVia: PaymentInitiationMethod.OnChain,
        settlementVia: "onchain",
        settlementAmount: toSats(50000),
        settlementFee: toSats(0),
        deprecated: {
          description: "pending",
          usd: 50000,
          feeUsd: 0,
          type: LedgerTransactionType.OnchainReceipt,
        },
        recipientUsername: null,
        status: TxStatus.Pending,
        createdAt: timestamp,
        addresses: ["userAddress2" as OnChainAddress],
      },
    ]
    expect(result.transactions).toEqual(expected)
  })
  it("translates handles price NaN", () => {
    const timestamp = new Date(Date.now())
    const submittedTransactions: SubmittedTransaction[] = [
      SubmittedTransaction({
        confirmations: 1,
        fee: toSats(1000),
        rawTx: {
          id: "id" as TxId,
          outs: [
            {
              sats: toSats(25000),
              address: "userAddress1" as OnChainAddress,
            },
          ],
        },
        createdAt: timestamp,
      }),
    ]
    const history = WalletTransactionHistory.fromLedger([])
    const addresses = ["userAddress1"] as OnChainAddress[]
    const result = history.addPendingIncoming(
      "walletId" as WalletId,
      submittedTransactions,
      addresses,
      NaN as UsdPerSat,
    )
    const expected = [
      {
        id: "id" as TxId,
        walletId: "walletId" as WalletId,
        initiationVia: PaymentInitiationMethod.OnChain,
        settlementVia: "onchain",
        settlementAmount: toSats(25000),
        settlementFee: toSats(0),
        deprecated: {
          description: "pending",
          usd: NaN,
          feeUsd: 0,
          type: LedgerTransactionType.OnchainReceipt,
        },
        recipientUsername: null,
        status: TxStatus.Pending,
        createdAt: timestamp,
        addresses: ["userAddress1" as OnChainAddress],
      },
    ]
    expect(result.transactions).toEqual(expected)
  })
})
