import crypto from "crypto"

import { LedgerTransactionType } from "@domain/ledger"
import { SettlementMethod, PaymentInitiationMethod, TxStatus } from "@domain/wallets"
import { translateMemo, WalletTransactionHistory } from "@domain/wallets/tx-history"
import { toSats } from "@domain/bitcoin"
import { IncomingOnChainTransaction } from "@domain/bitcoin/onchain"
import { MEMO_SHARING_CENTS_THRESHOLD, MEMO_SHARING_SATS_THRESHOLD } from "@config"
import { WalletCurrency } from "@domain/shared"
import { DisplayCurrency, MajorExponent, toCents } from "@domain/fiat"
import { DisplayPriceRatio, WalletPriceRatio } from "@domain/payments"

describe("translates ledger txs to wallet txs", () => {
  const timestamp = new Date(Date.now())

  const satsAmount = toSats(100_000)
  const satsFee = toSats(2)
  const centsAmount = toCents(2_000)
  const centsFee = toCents(10)
  const displayFee = 10 as DisplayCurrencyBaseAmount

  const baseLedgerTransaction = {
    id: "id" as LedgerTransactionId,
    satsFee,
    centsFee,
    displayFee,
    displayCurrency: DisplayCurrency.Usd,
    pendingConfirmation: false,
    journalId: "journalId" as LedgerJournalId,
    timestamp,
    feeKnownInAdvance: false,
  }

  const baseWalletTransaction = {
    id: "id" as LedgerTransactionId,
    status: TxStatus.Success,
    createdAt: timestamp,
  }

  const ledgerTxnsInputs = ({
    walletId,
    settlementAmount,
    satsAmount,
    centsAmount,
    currency,
  }: {
    walletId: WalletId
    settlementAmount: Satoshis | UsdCents
    satsAmount: Satoshis
    centsAmount: UsdCents
    currency: WalletCurrency
  }): LedgerTransaction<WalletCurrency>[] => {
    const currencyBaseLedgerTxns = {
      ...baseLedgerTransaction,
      walletId,
      satsAmount,
      centsAmount,
      displayAmount: centsAmount as unknown as DisplayCurrencyBaseAmount,
      currency,

      fee: undefined,
      feeUsd: undefined,
      usd: undefined,
    }

    return [
      {
        ...currencyBaseLedgerTxns,
        type: LedgerTransactionType.Invoice,

        debit: toSats(0),
        credit: settlementAmount,

        paymentHash: "paymentHash" as PaymentHash,
        pubkey: "pubkey" as Pubkey,
        memoFromPayer: "SomeMemo",
      },
      {
        ...currencyBaseLedgerTxns,
        recipientWalletId: "walletIdRecipient" as WalletId,
        type: LedgerTransactionType.IntraLedger,

        debit: toSats(0),
        credit: settlementAmount,

        paymentHash: "paymentHash" as PaymentHash,
        pubkey: "pubkey" as Pubkey,
        username: "username" as Username,
      },
      {
        ...currencyBaseLedgerTxns,
        recipientWalletId: "walletIdRecipient" as WalletId,
        type: LedgerTransactionType.OnchainIntraLedger,

        debit: toSats(0),
        credit: settlementAmount,

        address: "address" as OnChainAddress,
        txHash: "txHash" as OnChainTxHash,
      },
      {
        ...currencyBaseLedgerTxns,
        type: LedgerTransactionType.OnchainReceipt,

        debit: toSats(0),
        credit: settlementAmount,

        address: "address" as OnChainAddress,
        txHash: "txHash" as OnChainTxHash,
      },
    ]
  }

  const expectedWalletTxns = ({
    walletId,
    settlementAmount,
    centsAmount,
    currency,
  }: {
    walletId: WalletId
    settlementAmount: Satoshis | UsdCents
    centsAmount: UsdCents
    currency: WalletCurrency
  }): WalletTransaction[] => {
    const settlementFee = currency === WalletCurrency.Btc ? satsFee : centsFee
    const displayCurrencyPerSettlementCurrencyUnit = Math.abs(
      centsAmount / 100 / settlementAmount,
    )

    if (currency === WalletCurrency.Usd) {
      expect(displayCurrencyPerSettlementCurrencyUnit).toEqual(0.01)
    }

    const currencyBaseWalletTxns = {
      ...baseWalletTransaction,
      walletId,
      settlementCurrency: currency,

      settlementAmount,
      settlementFee,
      settlementDisplayAmount: (centsAmount / 100).toFixed(2),
      settlementDisplayFee: (centsFee / 100).toFixed(2),
      settlementDisplayCurrency: DisplayCurrency.Usd,
      displayCurrencyPerSettlementCurrencyUnit,
    }

    return [
      {
        ...currencyBaseWalletTxns,
        initiationVia: {
          type: PaymentInitiationMethod.Lightning,
          paymentHash: "paymentHash" as PaymentHash,
          pubkey: "pubkey" as Pubkey,
        },
        settlementVia: {
          type: SettlementMethod.Lightning,
          revealedPreImage: undefined,
        },
        memo: "SomeMemo",
      },

      {
        ...currencyBaseWalletTxns,
        initiationVia: {
          type: PaymentInitiationMethod.Lightning,
          paymentHash: "paymentHash" as PaymentHash,
          pubkey: "pubkey" as Pubkey,
        },
        settlementVia: {
          type: SettlementMethod.IntraLedger,
          counterPartyWalletId: "walletIdRecipient" as WalletId,
          counterPartyUsername: "username" as Username,
        },
        memo: null,
      },
      {
        ...currencyBaseWalletTxns,
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
      },
      {
        ...currencyBaseWalletTxns,
        initiationVia: {
          type: PaymentInitiationMethod.OnChain,
          address: "address" as OnChainAddress,
        },
        settlementVia: {
          type: SettlementMethod.OnChain,
          transactionHash: "txHash" as OnChainTxHash,
        },
        memo: null,
      },
    ]
  }

  describe("WalletTransactionHistory.fromLedger", () => {
    it("translates btc ledger txs", () => {
      const currency = WalletCurrency.Btc
      const settlementAmount = satsAmount

      const txnsArgs = {
        walletId: crypto.randomUUID() as WalletId,
        settlementAmount,
        satsAmount,
        centsAmount,
        centsFee,
        displayAmount: centsAmount,
        displayFee: centsFee,
        currency,
      }

      const ledgerTransactions = ledgerTxnsInputs(txnsArgs)
      const result = WalletTransactionHistory.fromLedger({
        ledgerTransactions,
        nonEndUserWalletIds: [],
      })

      const expected = expectedWalletTxns(txnsArgs)
      expect(result.transactions).toEqual(expected)
    })

    it("translates usd ledger txs", () => {
      const currency = WalletCurrency.Usd
      const settlementAmount = centsAmount

      const txnsArgs = {
        walletId: crypto.randomUUID() as WalletId,
        settlementAmount,
        satsAmount,
        centsAmount,
        centsFee,
        displayAmount: centsAmount,
        displayFee: centsFee,
        currency,
      }

      const ledgerTransactions = ledgerTxnsInputs(txnsArgs)
      const result = WalletTransactionHistory.fromLedger({
        ledgerTransactions,
        nonEndUserWalletIds: [],
      })

      const expected = expectedWalletTxns(txnsArgs)
      expect(result.transactions).toEqual(expected)
    })
  })
})

describe("translateDescription", () => {
  const journalIdMemoArgs = {
    walletId: "" as WalletId,
    journalId: "" as LedgerJournalId,
    nonEndUserWalletIds: ["dealerBtcWalletId" as WalletId],
  }

  it("return journalId for dealer wallet id", () => {
    const journalId = "journal-01" as LedgerJournalId

    const result = translateMemo({
      memoFromPayer: "some memo",
      credit: MEMO_SHARING_SATS_THRESHOLD,
      currency: WalletCurrency.Btc,
      walletId: journalIdMemoArgs.nonEndUserWalletIds[0],
      journalId,
      nonEndUserWalletIds: journalIdMemoArgs.nonEndUserWalletIds,
    })
    expect(result).toEqual(`JournalId:${journalId}`)
  })

  it("returns the memoFromPayer for BTC wallet", () => {
    const result = translateMemo({
      memoFromPayer: "some memo",
      credit: MEMO_SHARING_SATS_THRESHOLD,
      currency: WalletCurrency.Btc,
      ...journalIdMemoArgs,
    })
    expect(result).toEqual("some memo")
  })

  it("returns memo if there is no memoFromPayer for BTC wallet", () => {
    const result = translateMemo({
      lnMemo: "some memo",
      credit: MEMO_SHARING_SATS_THRESHOLD,
      currency: WalletCurrency.Btc,
      ...journalIdMemoArgs,
    })
    expect(result).toEqual("some memo")
  })

  it("returns null under spam thresh for BTC wallet", () => {
    const result = translateMemo({
      memoFromPayer: "some memo",
      credit: 1 as Satoshis,
      currency: WalletCurrency.Btc,
      ...journalIdMemoArgs,
    })
    expect(result).toBeNull()
  })

  it("returns memo for debit under spam threshold for BTC wallet", () => {
    const result = translateMemo({
      memoFromPayer: "some memo",
      credit: 0 as Satoshis,
      currency: WalletCurrency.Btc,
      ...journalIdMemoArgs,
    })
    expect(result).toEqual("some memo")
  })

  it("returns the memoFromPayer for USD wallet", () => {
    const result = translateMemo({
      memoFromPayer: "some memo",
      credit: MEMO_SHARING_CENTS_THRESHOLD,
      currency: WalletCurrency.Usd,
      ...journalIdMemoArgs,
    })
    expect(result).toEqual("some memo")
  })

  it("returns memo if there is no memoFromPayer for USD wallet", () => {
    const result = translateMemo({
      lnMemo: "some memo",
      credit: MEMO_SHARING_CENTS_THRESHOLD,
      currency: WalletCurrency.Usd,
      ...journalIdMemoArgs,
    })
    expect(result).toEqual("some memo")
  })

  it("returns null under spam thresh for USD wallet", () => {
    const result = translateMemo({
      memoFromPayer: "some memo",
      credit: 1 as UsdCents,
      currency: WalletCurrency.Usd,
      ...journalIdMemoArgs,
    })
    expect(result).toBeNull()
  })

  it("returns memo for debit under spam threshold for USD wallet", () => {
    const result = translateMemo({
      memoFromPayer: "some memo",
      credit: 0 as UsdCents,
      currency: WalletCurrency.Usd,
      ...journalIdMemoArgs,
    })
    expect(result).toEqual("some memo")
  })
})

describe("ConfirmedTransactionHistory.addPendingIncoming", () => {
  const walletPriceRatio = WalletPriceRatio({
    usd: { amount: 20n, currency: WalletCurrency.Usd },
    btc: { amount: 1000n, currency: WalletCurrency.Btc },
  })
  if (walletPriceRatio instanceof Error) throw walletPriceRatio

  const displayPriceRatio = DisplayPriceRatio({
    displayAmountInMinorUnit: { amount: 16, currency: DisplayCurrency.Usd },
    walletAmount: { amount: 1000n, currency: WalletCurrency.Btc },
    displayMajorExponent: MajorExponent.STANDARD,
  })
  if (displayPriceRatio instanceof Error) throw displayPriceRatio

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
    const history = WalletTransactionHistory.fromLedger({
      ledgerTransactions: [],
      nonEndUserWalletIds: [],
    })
    const addresses = ["userAddress1", "userAddress2"] as OnChainAddress[]
    const result = history.addPendingIncoming({
      pendingIncoming: incomingTxs,
      addressesByWalletId: { [walletId]: addresses },
      walletDetailsByWalletId: {
        [walletId]: {
          walletCurrency: WalletCurrency.Btc,
          walletPriceRatio,
          depositFeeRatio: 0 as DepositFeeRatio,
          displayCurrency: "EUR" as DisplayCurrency,
          displayPriceRatio,
        },
      },
    })
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
        settlementDisplayAmount: (25000 * 0.00016).toFixed(2),
        settlementDisplayFee: (0).toFixed(2),
        settlementDisplayCurrency: "EUR",
        settlementCurrency: WalletCurrency.Btc,
        displayCurrencyPerSettlementCurrencyUnit: 0.00016,
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
        settlementCurrency: WalletCurrency.Btc,
        settlementDisplayAmount: (50000 * 0.00016).toFixed(2),
        settlementDisplayFee: (0).toFixed(2),
        settlementDisplayCurrency: "EUR",
        memo: null,
        settlementFee: toSats(0),
        displayCurrencyPerSettlementCurrencyUnit: 0.00016,

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
    const history = WalletTransactionHistory.fromLedger({
      ledgerTransactions: [],
      nonEndUserWalletIds: [],
    })
    const addresses = ["userAddress1"] as OnChainAddress[]
    const result = history.addPendingIncoming({
      pendingIncoming: incomingTxs,
      addressesByWalletId: { [walletId]: addresses },
      walletDetailsByWalletId: {
        [walletId]: {
          walletCurrency: WalletCurrency.Btc,
          walletPriceRatio,
          depositFeeRatio: 0 as DepositFeeRatio,
          displayCurrency: "EUR" as DisplayCurrency,
          displayPriceRatio: undefined,
        },
      },
    })
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
        settlementCurrency: WalletCurrency.Btc,
        settlementDisplayAmount: "NaN",
        settlementDisplayFee: "NaN",
        settlementDisplayCurrency: "EUR",
        displayCurrencyPerSettlementCurrencyUnit: NaN,
        status: TxStatus.Pending,
        createdAt: timestamp,
      },
    ]
    expect(result.transactions).toEqual(expected)
  })
})
