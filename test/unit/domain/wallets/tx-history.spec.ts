import crypto from "crypto"

import { LedgerTransactionType } from "@domain/ledger"
import { SettlementMethod, PaymentInitiationMethod, TxStatus } from "@domain/wallets"
import { translateMemo, WalletTransactionHistory } from "@domain/wallets/tx-history"
import { toSats } from "@domain/bitcoin"
import { IncomingOnChainTransaction } from "@domain/bitcoin/onchain"
import { MEMO_SHARING_SATS_THRESHOLD } from "@config"

describe("WalletTransactionHistory.fromLedger", () => {
  it("translates ledger txs to wallet txs", () => {
    const timestamp = new Date(Date.now())

    const settlementAmount = toSats(100000)
    const usd = 10
    const settlementDisplayCurrencyPerSat = Math.abs(usd / settlementAmount)
    const walletId = crypto.randomUUID() as WalletId

    const ledgerTransactions: LedgerTransaction<WalletCurrency>[] = [
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
        settlementDisplayCurrencyPerSat,
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
        settlementDisplayCurrencyPerSat,

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
        settlementDisplayCurrencyPerSat,

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
        settlementDisplayCurrencyPerSat,

        status: TxStatus.Success,
        createdAt: timestamp,
      },
    ]
    expect(result.transactions).toEqual(expected)
  })
})

describe("translateDescription", () => {
  it("returns the memoFromPayer", () => {
    const result = translateMemo({
      memoFromPayer: "some memo",
      credit: MEMO_SHARING_SATS_THRESHOLD,
    })
    expect(result).toEqual("some memo")
  })

  it("returns memo if there is no memoFromPayer", () => {
    const result = translateMemo({
      lnMemo: "some memo",
      credit: MEMO_SHARING_SATS_THRESHOLD,
    })
    expect(result).toEqual("some memo")
  })

  it("returns null under spam thresh", () => {
    const result = translateMemo({
      memoFromPayer: "some memo",
      credit: 1,
    })
    expect(result).toBeNull()
  })

  it("returns memo for debit under spam threshold", () => {
    const result = translateMemo({
      memoFromPayer: "some memo",
      credit: 0,
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
      1 as DisplayCurrencyPerSat,
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
        settlementDisplayCurrencyPerSat: 1,
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
        settlementDisplayCurrencyPerSat: 1,

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
      NaN as DisplayCurrencyPerSat,
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
        settlementDisplayCurrencyPerSat: NaN,
        status: TxStatus.Pending,
        createdAt: timestamp,
      },
    ]
    expect(result.transactions).toEqual(expected)
  })
})
