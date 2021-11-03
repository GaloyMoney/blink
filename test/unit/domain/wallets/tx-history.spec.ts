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

    const settlementAmount = toSats(100000)
    const usd = 10
    const settlementUsdPerSat = Math.abs(usd / settlementAmount)

    const ledgerTransactions: LedgerTransaction[] = [
      {
        id: "id" as LedgerTransactionId,
        walletId: "walletId" as WalletId,
        type: LedgerTransactionType.Invoice,
        paymentHash: "paymentHash" as PaymentHash,
        pubkey: "pubkey" as Pubkey,
        debit: toSats(0),
        fee: toSats(0),
        credit: settlementAmount,
        usd,
        feeUsd: 0.1,
        currency: "BTC",
        memoFromPayer: "SomeMemo",
        pendingConfirmation: false,
        journalId: "journalId" as LedgerJournalId,
        timestamp,
        feeKnownInAdvance: false,
      },
      {
        id: "id" as LedgerTransactionId,
        walletId: "walletId" as WalletId,
        type: LedgerTransactionType.IntraLedger,
        paymentHash: "paymentHash" as PaymentHash,
        pubkey: "pubkey" as Pubkey,
        username: "username" as Username,
        debit: toSats(0),
        fee: toSats(0),
        credit: settlementAmount,
        usd,
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
        address: "address" as OnChainAddress,
        paymentHash: "paymentHash" as PaymentHash,
        txId: "txId" as TxId,
        debit: toSats(0),
        fee: toSats(0),
        credit: settlementAmount,
        usd,
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
        credit: settlementAmount,
        usd,
        feeUsd: 0.1,
        currency: "BTC",
        pendingConfirmation: false,
        journalId: "journalId" as LedgerJournalId,
        timestamp,
        address: "address" as OnChainAddress,
        txId: "txId" as TxId,
        feeKnownInAdvance: false,
      },
    ]
    const result = WalletTransactionHistory.fromLedger(ledgerTransactions)
    const expected = [
      {
        id: "id" as LedgerTransactionId,
        walletId: "walletId" as WalletId,
        initiationVia: PaymentInitiationMethod.Lightning,
        memo: "SomeMemo",
        settlementVia: SettlementMethod.Lightning,
        settlementAmount,
        settlementFee: toSats(0),
        settlementUsdPerSat,
        paymentHash: "paymentHash" as PaymentHash,
        pubkey: "pubkey" as Pubkey,
        deprecated: {
          description: "SomeMemo",
          usd,
          feeUsd: 0.1,
          type: LedgerTransactionType.Invoice,
        },
        otherPartyUsername: null,
        status: TxStatus.Success,
        createdAt: timestamp,
      },
      {
        id: "id" as LedgerTransactionId,
        walletId: "walletId" as WalletId,
        initiationVia: PaymentInitiationMethod.Lightning,
        settlementVia: SettlementMethod.IntraLedger,
        memo: null,
        otherPartyUsername: "username",
        settlementAmount,
        settlementFee: toSats(0),
        settlementUsdPerSat,
        paymentHash: "paymentHash" as PaymentHash,
        pubkey: "pubkey" as Pubkey,
        deprecated: {
          description: "from username",
          usd,
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
        memo: null,
        settlementAmount,
        settlementFee: toSats(0),
        settlementUsdPerSat,
        deprecated: {
          description: "onchain_on_us",
          usd,
          feeUsd: 0.1,
          type: LedgerTransactionType.OnchainIntraLedger,
        },
        otherPartyUsername: null,
        address: "address" as OnChainAddress,
        transactionHash: "txId",
        status: TxStatus.Success,
        createdAt: timestamp,
      },
      {
        id: "id" as LedgerTransactionId,
        walletId: "walletId" as WalletId,
        initiationVia: PaymentInitiationMethod.OnChain,
        settlementVia: SettlementMethod.OnChain,
        memo: null,
        settlementAmount,
        settlementFee: toSats(0),
        settlementUsdPerSat,
        deprecated: {
          description: "onchain_receipt",
          usd,
          feeUsd: 0.1,
          type: LedgerTransactionType.OnchainReceipt,
        },
        otherPartyUsername: null,
        status: TxStatus.Success,
        createdAt: timestamp,
        address: "address" as OnChainAddress,
        transactionHash: "txId",
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
        memo: null,
        settlementVia: "onchain",
        settlementAmount: toSats(25000),
        settlementFee: toSats(0),
        settlementUsdPerSat: 1,
        deprecated: {
          description: "pending",
          usd: 25000,
          feeUsd: 0,
          type: LedgerTransactionType.OnchainReceipt,
        },
        otherPartyUsername: null,
        status: TxStatus.Pending,
        createdAt: timestamp,
        transactionHash: "id",
        address: "userAddress1" as OnChainAddress,
      },
      {
        id: "id" as TxId,
        walletId: "walletId" as WalletId,
        initiationVia: PaymentInitiationMethod.OnChain,
        settlementVia: "onchain",
        settlementAmount: toSats(50000),
        memo: null,
        settlementFee: toSats(0),
        settlementUsdPerSat: 1,
        deprecated: {
          description: "pending",
          usd: 50000,
          feeUsd: 0,
          type: LedgerTransactionType.OnchainReceipt,
        },
        otherPartyUsername: null,
        status: TxStatus.Pending,
        createdAt: timestamp,
        address: "userAddress2" as OnChainAddress,
        transactionHash: "id",
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
        memo: null,
        settlementAmount: toSats(25000),
        settlementFee: toSats(0),
        settlementUsdPerSat: NaN,
        deprecated: {
          description: "pending",
          usd: NaN,
          feeUsd: 0,
          type: LedgerTransactionType.OnchainReceipt,
        },
        otherPartyUsername: null,
        status: TxStatus.Pending,
        createdAt: timestamp,
        address: "userAddress1" as OnChainAddress,
        transactionHash: "id",
      },
    ]
    expect(result.transactions).toEqual(expected)
  })
})
