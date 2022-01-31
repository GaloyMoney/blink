import crypto from "crypto"

import { MEMO_SHARING_SATS_THRESHOLD } from "@config"
import { LedgerTransactionType } from "@domain/ledger"
import { SettlementMethod, PaymentInitiationMethod, TxStatus } from "@domain/wallets"
import {
  WalletTransactionHistory,
  translateDescription,
} from "@domain/wallets/tx-history"
import { toSats } from "@domain/bitcoin"
import { IncomingOnChainTransaction } from "@domain/bitcoin/onchain"

describe("WalletTransactionHistory.fromLedger", () => {
  it("translates ledger txs to wallet txs", () => {
    const timestamp = new Date(Date.now())

    const settlementAmount = toSats(100000)
    const usd = 10
    const settlementUsdPerSat = Math.abs(usd / settlementAmount)
    const walletId = crypto.randomUUID() as WalletId

    const ledgerTransactions: LedgerTransaction[] = [
      {
        id: "id" as LedgerTransactionId,
        walletId,
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
        walletId,
        recipientWalletId: "walletIdRecipient" as WalletId,
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
        walletId,
        recipientWalletId: "walletIdRecipient" as WalletId,
        type: LedgerTransactionType.OnchainIntraLedger,
        address: "address" as OnChainAddress,
        paymentHash: "paymentHash" as PaymentHash,
        txHash: "txHash" as OnChainTxHash,
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
        walletId,
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
        txHash: "txHash" as OnChainTxHash,
        feeKnownInAdvance: false,
      },
    ]
    const result = WalletTransactionHistory.fromLedger(ledgerTransactions)
    const expected = [
      {
        id: "id" as LedgerTransactionId,
        walletId,
        initiationVia: {
          type: PaymentInitiationMethod.Lightning,
          paymentHash: "paymentHash" as PaymentHash,
          pubkey: "pubkey" as Pubkey,
        },
        memo: "SomeMemo",
        settlementVia: {
          type: SettlementMethod.Lightning,
          revealedPreImage: null,
        },
        settlementAmount,
        settlementFee: toSats(0),
        settlementUsdPerSat,
        deprecated: {
          description: "SomeMemo",
          usd,
          feeUsd: 0.1,
          type: LedgerTransactionType.Invoice,
        },
        status: TxStatus.Success,
        createdAt: timestamp,
      },
      {
        id: "id" as LedgerTransactionId,
        walletId,
        initiationVia: {
          type: PaymentInitiationMethod.Lightning,
          paymentHash: "paymentHash" as PaymentHash,
          pubkey: "pubkey" as Pubkey,
        },
        settlementVia: {
          type: SettlementMethod.IntraLedger,
          counterPartyWalletId: "walletIdRecipient" as WalletId,
          counterPartyUsername: "username",
        },
        memo: null,
        settlementAmount,
        settlementFee: toSats(0),
        settlementUsdPerSat,

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
        walletId,
        initiationVia: {
          type: PaymentInitiationMethod.OnChain,
          address: "address" as OnChainAddress,
        },
        settlementVia: {
          type: SettlementMethod.IntraLedger,
          counterPartyWalletId: "walletIdRecipient" as WalletId,
          counterPartyUsername: null,
        },
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

        status: TxStatus.Success,
        createdAt: timestamp,
      },
      {
        id: "id" as LedgerTransactionId,
        walletId,
        initiationVia: {
          type: PaymentInitiationMethod.OnChain,
          address: "address" as OnChainAddress,
        },
        settlementVia: {
          type: SettlementMethod.OnChain,
          transactionHash: "txHash",
        },
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

        status: TxStatus.Success,
        createdAt: timestamp,
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
    const walletId = crypto.randomUUID() as WalletId

    const timestamp = new Date(Date.now())
    const incomingTxs: IncomingOnChainTransaction[] = [
      IncomingOnChainTransaction({
        confirmations: 1,
        fee: toSats(1000),
        rawTx: {
          txHash: "txHash" as OnChainTxHash,
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
      walletId,
      incomingTxs,
      addresses,
      1 as UsdPerSat,
    )
    const expected = [
      {
        id: "txHash" as OnChainTxHash,
        walletId,
        initiationVia: {
          type: PaymentInitiationMethod.OnChain,
          address: "userAddress1" as OnChainAddress,
        },
        memo: null,
        settlementVia: {
          type: SettlementMethod.OnChain,
          transactionHash: "txHash",
        },
        settlementAmount: toSats(25000),
        settlementFee: toSats(0),
        settlementUsdPerSat: 1,
        deprecated: {
          description: "pending",
          usd: 25000,
          feeUsd: 0,
          type: LedgerTransactionType.OnchainReceipt,
        },
        status: TxStatus.Pending,
        createdAt: timestamp,
      },
      {
        id: "txHash" as OnChainTxHash,
        walletId,
        initiationVia: {
          type: PaymentInitiationMethod.OnChain,
          address: "userAddress2" as OnChainAddress,
        },
        settlementVia: {
          type: SettlementMethod.OnChain,
          transactionHash: "txHash",
        },
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

        status: TxStatus.Pending,
        createdAt: timestamp,
      },
    ]
    expect(result.transactions).toEqual(expected)
  })

  it("translates handles price NaN", () => {
    const walletId = crypto.randomUUID() as WalletId

    const timestamp = new Date(Date.now())
    const incomingTxs: IncomingOnChainTransaction[] = [
      IncomingOnChainTransaction({
        confirmations: 1,
        fee: toSats(1000),
        rawTx: {
          txHash: "txHash" as OnChainTxHash,
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
      walletId,
      incomingTxs,
      addresses,
      NaN as UsdPerSat,
    )
    const expected = [
      {
        id: "txHash" as OnChainTxHash,
        walletId,
        initiationVia: {
          type: PaymentInitiationMethod.OnChain,
          address: "userAddress1" as OnChainAddress,
        },
        settlementVia: {
          type: SettlementMethod.OnChain,
          transactionHash: "txHash",
        },
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
        status: TxStatus.Pending,
        createdAt: timestamp,
      },
    ]
    expect(result.transactions).toEqual(expected)
  })
})
