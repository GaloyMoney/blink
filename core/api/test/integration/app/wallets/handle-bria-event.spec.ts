import crypto from "crypto"

import { getOnChainWalletConfig } from "@/config"

import {
  addPendingTransaction,
  addSettledTransaction,
  getLastOnChainAddress,
  registerBroadcastedPayout,
  removePendingTransaction,
} from "@/app/wallets"

import {
  DisplayAmountsConverter,
  UsdDisplayCurrency,
  displayAmountFromNumber,
} from "@/domain/fiat"
import { UnknownLedgerError, toLiabilitiesWalletId } from "@/domain/ledger"
import { DisplayPriceRatio, WalletPriceRatio } from "@/domain/payments"
import { AmountCalculator, WalletCurrency, ZERO_SATS } from "@/domain/shared"

import { getBankOwnerWalletId } from "@/services/ledger/caching"
import * as LedgerFacade from "@/services/ledger/facade"
import * as LedgerFacadeSendImpl from "@/services/ledger/facade/onchain-send"
import { Transaction, TransactionMetadata } from "@/services/ledger/schema"
import { WalletOnChainPendingReceive } from "@/services/mongoose/schema"

import { LessThanDustThresholdError } from "@/domain/errors"

import {
  createMandatoryUsers,
  createRandomUserAndBtcWallet,
  generateHash,
} from "test/helpers"

const calc = AmountCalculator()

const VOUT_0 = 0 as OnChainTxVout
const VOUT_1 = 1 as OnChainTxVout
const { dustThreshold } = getOnChainWalletConfig()

let walletId: WalletId
let bankOwnerWalletId: WalletId
let accountId: AccountId
let address: OnChainAddress

beforeAll(async () => {
  await createMandatoryUsers()
  ;({ id: walletId, accountId } = await createRandomUserAndBtcWallet())

  const addressResult = await getLastOnChainAddress(walletId)
  if (addressResult instanceof Error) throw addressResult
  address = addressResult

  bankOwnerWalletId = await getBankOwnerWalletId()
})

afterEach(async () => {
  await Transaction.deleteMany({})
  await TransactionMetadata.deleteMany({})
  await WalletOnChainPendingReceive.deleteMany({})
})

const getRandomBtcAmountForOnchain = (): BtcPaymentAmount => {
  const floor = 10_000
  const amount = floor + Math.round(Math.random() * floor)
  return { amount: BigInt(amount), currency: WalletCurrency.Btc }
}

const dustAmount: BtcPaymentAmount = {
  amount: BigInt(dustThreshold - 1),
  currency: WalletCurrency.Btc,
}

describe("Bria Event Handlers", () => {
  describe("addPendingTransaction", () => {
    it("persists a new pending transaction", async () => {
      const txId = generateHash() as OnChainTxHash
      const vout = VOUT_0

      const res = await addPendingTransaction({
        txId,
        vout,
        satoshis: getRandomBtcAmountForOnchain(),
        address,
      })
      expect(res).toBe(true)

      const result = await WalletOnChainPendingReceive.countDocuments({
        transactionHash: txId,
        vout,
      })
      expect(result).toEqual(1)
    })

    it("handles event replay", async () => {
      const txId = generateHash() as OnChainTxHash
      const vout = VOUT_0

      const args = {
        txId,
        vout,
        satoshis: getRandomBtcAmountForOnchain(),
        address,
      }
      const results = await Promise.all([
        addPendingTransaction(args),
        addPendingTransaction(args),
      ])
      const success = results.filter((res) => res === true)
      expect(success).toHaveLength(2)

      const result = await WalletOnChainPendingReceive.countDocuments({
        transactionHash: txId,
        vout,
      })
      expect(result).toEqual(1)
    })

    it("records multiple utxos for same transaction hash", async () => {
      const txId = generateHash() as OnChainTxHash

      const results = await Promise.all([
        addPendingTransaction({
          txId,
          vout: VOUT_0,
          satoshis: getRandomBtcAmountForOnchain(),
          address,
        }),
        addPendingTransaction({
          txId,
          vout: VOUT_1,
          satoshis: getRandomBtcAmountForOnchain(),
          address,
        }),
      ])
      expect(results.filter((res) => res === true)).toHaveLength(2)

      const resultVout0 = await WalletOnChainPendingReceive.countDocuments({
        transactionHash: txId,
        vout: VOUT_0,
      })
      expect(resultVout0).toEqual(1)

      const resultVout1 = await WalletOnChainPendingReceive.countDocuments({
        transactionHash: txId,
        vout: VOUT_1,
      })
      expect(resultVout1).toEqual(1)

      const resultTxId = await WalletOnChainPendingReceive.countDocuments({
        transactionHash: txId,
      })
      expect(resultTxId).toEqual(2)
    })

    it("fails if the amount is less than on chain dust amount", async () => {
      const txId = generateHash() as OnChainTxHash
      const vout = VOUT_0
      const satoshis = dustAmount

      const result = await addPendingTransaction({
        txId,
        vout,
        satoshis,
        address,
      })

      expect(result).toBeInstanceOf(LessThanDustThresholdError)
    })
  })

  describe("removePendingTransaction", () => {
    it("removes an already existing transaction", async () => {
      const txId = generateHash() as OnChainTxHash
      const vout = VOUT_0
      const satoshis = getRandomBtcAmountForOnchain()

      const pendingRes = await addPendingTransaction({
        txId,
        vout,
        satoshis,
        address,
      })
      expect(pendingRes).toBe(true)

      const pendingTxnsBefore = await WalletOnChainPendingReceive.countDocuments({
        transactionHash: txId,
        vout,
      })
      expect(pendingTxnsBefore).toEqual(1)

      const settledRes = await removePendingTransaction({
        txId,
        vout,
        address,
      })
      expect(settledRes).toBe(true)

      const pendingTxnsAfter = await WalletOnChainPendingReceive.countDocuments({
        transactionHash: txId,
        vout,
      })
      expect(pendingTxnsAfter).toEqual(0)
    })

    it("ignores transactions that were not recorded", async () => {
      const txId = generateHash() as OnChainTxHash
      const vout = VOUT_0

      const pendingRes = await removePendingTransaction({
        txId,
        vout,
        address,
      })
      expect(pendingRes).toBe(true)
    })
  })

  describe("addSettledTransaction", () => {
    it("persists a new settled transaction", async () => {
      const txId = generateHash() as OnChainTxHash
      const vout = VOUT_0
      const satoshis = getRandomBtcAmountForOnchain()

      const pendingRes = await addPendingTransaction({
        txId,
        vout,
        satoshis,
        address,
      })
      expect(pendingRes).toBe(true)

      const pendingTxnsBefore = await WalletOnChainPendingReceive.countDocuments({
        transactionHash: txId,
        vout,
      })
      expect(pendingTxnsBefore).toEqual(1)

      const settledRes = await addSettledTransaction({
        txId,
        vout,
        satoshis,
        address,
      })
      expect(settledRes).toBe(true)

      const pendingTxnsAfter = await WalletOnChainPendingReceive.countDocuments({
        transactionHash: txId,
        vout,
      })
      expect(pendingTxnsAfter).toEqual(0)

      const ledgerTxns = await Transaction.countDocuments({
        hash: txId,
        vout,
        accounts: toLiabilitiesWalletId(walletId),
      })
      expect(ledgerTxns).toEqual(1)

      // Cleanup to clear tests accounting
      await Transaction.deleteMany({ hash: txId })
    })

    it("handles event replay", async () => {
      const txId = generateHash() as OnChainTxHash
      const vout = VOUT_0
      const satoshis = getRandomBtcAmountForOnchain()

      const args = {
        txId,
        vout,
        satoshis,
        address,
      }

      const pendingRes = await addPendingTransaction(args)
      expect(pendingRes).toBe(true)

      const pendingTxnsBefore = await WalletOnChainPendingReceive.countDocuments({
        transactionHash: txId,
        vout,
      })
      expect(pendingTxnsBefore).toEqual(1)

      const settledResults = await Promise.all([
        addSettledTransaction(args),
        addSettledTransaction(args),
      ])
      expect(settledResults.filter((res) => res === true)).toHaveLength(2)

      const pendingTxnsAfter = await WalletOnChainPendingReceive.countDocuments({
        transactionHash: txId,
        vout,
      })
      expect(pendingTxnsAfter).toEqual(0)

      const ledgerTxns = await Transaction.countDocuments({
        hash: txId,
        vout,
        accounts: toLiabilitiesWalletId(walletId),
      })
      expect(ledgerTxns).toEqual(1)

      // Cleanup to clear tests accounting
      await Transaction.deleteMany({ hash: txId })
    })

    it("records multiple utxos for same transaction hash", async () => {
      const txId = generateHash() as OnChainTxHash
      const satoshis = getRandomBtcAmountForOnchain()

      const args1 = {
        txId,
        vout: VOUT_0,
        satoshis,
        address,
      }
      const args2 = {
        txId,
        vout: VOUT_1,
        satoshis,
        address,
      }

      const results = await Promise.all([
        addPendingTransaction(args1),
        addPendingTransaction(args2),
      ])
      expect(results.filter((res) => res === true)).toHaveLength(2)

      const PendingVout0Before = await WalletOnChainPendingReceive.countDocuments({
        transactionHash: txId,
        vout: VOUT_0,
      })
      expect(PendingVout0Before).toEqual(1)

      const PendingVout1Before = await WalletOnChainPendingReceive.countDocuments({
        transactionHash: txId,
        vout: VOUT_1,
      })
      expect(PendingVout1Before).toEqual(1)

      const settledResults = await Promise.all([
        addSettledTransaction(args1),
        addSettledTransaction(args2),
      ])
      expect(settledResults.filter((res) => res === true)).toHaveLength(2)

      const pendingTxnsAfter = await WalletOnChainPendingReceive.countDocuments({
        transactionHash: txId,
      })
      expect(pendingTxnsAfter).toEqual(0)

      expect(args1.vout).not.toEqual(args2.vout)
      const ledgerTxnsVout1 = await Transaction.countDocuments({
        hash: txId,
        vout: args1.vout,
        accounts: toLiabilitiesWalletId(walletId),
      })
      expect(ledgerTxnsVout1).toEqual(1)
      const ledgerTxnsVout2 = await Transaction.countDocuments({
        hash: txId,
        vout: args2.vout,
        accounts: toLiabilitiesWalletId(walletId),
      })
      expect(ledgerTxnsVout2).toEqual(1)

      // Cleanup to clear tests accounting
      await Transaction.deleteMany({ hash: txId })
    })

    it("fails if the amount is less than on chain dust amount", async () => {
      const txId = generateHash() as OnChainTxHash
      const vout = VOUT_0
      const satoshis = dustAmount

      const result = await addSettledTransaction({
        txId,
        vout,
        satoshis,
        address,
      })

      expect(result).toBeInstanceOf(LessThanDustThresholdError)
    })
  })

  describe("registerBroadcastedPayout", () => {
    const addressForPayout = "addressForPayout" as OnChainAddress
    const estimatedFee = { amount: 2500n, currency: WalletCurrency.Btc }

    const addOnChainPaymentLedgerTxns = async ({
      estimatedFee,
      actualFee,
    }: {
      estimatedFee: BtcPaymentAmount
      actualFee: BtcPaymentAmount
    }): Promise<PayoutBroadcast> => {
      const payoutId = crypto.randomUUID() as PayoutId

      const priceRatio = WalletPriceRatio({
        usd: { amount: 20n, currency: WalletCurrency.Usd },
        btc: { amount: 1000n, currency: WalletCurrency.Btc },
      })
      if (priceRatio instanceof Error) throw priceRatio

      const displayAmount = displayAmountFromNumber({
        amount: 20,
        currency: UsdDisplayCurrency,
      })
      if (displayAmount instanceof Error) throw displayAmount
      const displayPriceRatio = DisplayPriceRatio({
        displayAmount,
        walletAmount: { amount: 1000n, currency: WalletCurrency.Btc },
      })
      if (displayPriceRatio instanceof Error) throw displayPriceRatio

      const btcMinerFee = estimatedFee
      const btcBankFee = { amount: 2_000n, currency: WalletCurrency.Btc }
      const usdBankFee = priceRatio.convertFromBtc(btcBankFee)
      const btcProtocolAndBankFee = calc.add(btcMinerFee, btcBankFee)
      const usdProtocolAndBankFee = priceRatio.convertFromBtc(btcProtocolAndBankFee)

      const btcPaymentAmount = { amount: 10_000n, currency: WalletCurrency.Btc }
      const usdPaymentAmount = priceRatio.convertFromBtc(btcPaymentAmount)
      const btcTotalAmount = calc.add(btcProtocolAndBankFee, btcPaymentAmount)
      const usdTotalAmount = priceRatio.convertFromBtc(btcTotalAmount)

      const {
        displayAmount: displayPaymentAmount,
        displayFee: displayProtocolAndBankFee,
      } = DisplayAmountsConverter(displayPriceRatio).convert({
        btcPaymentAmount,
        btcProtocolAndBankFee,
        usdPaymentAmount,
        usdProtocolAndBankFee,
      })

      const {
        metadata,
        debitAccountAdditionalMetadata,
        internalAccountsAdditionalMetadata,
      } = LedgerFacade.OnChainSendLedgerMetadata({
        paymentAmounts: {
          btcPaymentAmount,
          btcProtocolAndBankFee,

          usdPaymentAmount,
          usdProtocolAndBankFee,
        },

        amountDisplayCurrency: Number(
          displayPaymentAmount.amountInMinor,
        ) as DisplayCurrencyBaseAmount,
        feeDisplayCurrency: Number(
          displayProtocolAndBankFee.amountInMinor,
        ) as DisplayCurrencyBaseAmount,
        displayCurrency: displayPaymentAmount.currency,

        payeeAddresses: ["address" as OnChainAddress],
        sendAll: false,
        memoOfPayer: undefined,
      })
      const journal = await LedgerFacade.recordSendOnChain({
        description: "",
        amountToDebitSender: {
          btc: btcTotalAmount,
          usd: usdTotalAmount,
        },
        bankFee: { btc: btcBankFee, usd: usdBankFee },
        senderWalletDescriptor: {
          id: walletId,
          currency: WalletCurrency.Btc,
          accountId,
        },
        metadata,
        additionalDebitMetadata: debitAccountAdditionalMetadata,
        additionalInternalMetadata: internalAccountsAdditionalMetadata,
      })
      if (journal instanceof Error) throw journal

      const updated = await LedgerFacade.setOnChainTxPayoutId({
        journalId: journal.journalId,
        payoutId,
      })
      if (updated instanceof Error) throw updated

      return {
        type: "payout_broadcast",
        id: payoutId,
        proportionalFee: actualFee,
        satoshis: btcPaymentAmount,
        txId: generateHash() as OnChainTxHash,
        vout: 0 as OnChainTxVout,
        address: addressForPayout,
      }
    }

    it("handles a broadcast event", async () => {
      // Setup a transaction in database
      const btcFeeDifference = ZERO_SATS
      const actualFee = calc.add(estimatedFee, btcFeeDifference)

      const broadcastPayload = await addOnChainPaymentLedgerTxns({
        estimatedFee,
        actualFee,
      })
      const { proportionalFee, id: payoutId, txId, vout } = broadcastPayload

      // Run before-broadcast checks
      const txnsBefore = await LedgerFacade.getTransactionsByPayoutId(payoutId)
      if (txnsBefore instanceof Error) throw txnsBefore
      expect(txnsBefore.length).toEqual(2)

      const hashesBefore = txnsBefore.map((txn) => txn.txHash)
      const hashesBeforeSet = new Set(hashesBefore)
      expect(hashesBeforeSet.size).toEqual(1)

      // Register broadcast
      const res = await registerBroadcastedPayout({
        payoutId,
        proportionalFee,
        txId,
        vout,
      })
      expect(res).toBe(true)

      // Idempotency check
      const resRerun = await registerBroadcastedPayout({
        payoutId,
        proportionalFee,
        txId,
        vout,
      })
      expect(resRerun).toBe(true)

      // Run after-broadcast checks
      const txnsAfter = await LedgerFacade.getTransactionsByPayoutId(payoutId)
      if (txnsAfter instanceof Error) throw txnsAfter
      expect(txnsAfter.length).toEqual(2)

      const hashesAfter = txnsAfter.map((txn) => txn.txHash)
      const hashesAfterSet = new Set(hashesAfter)
      expect(hashesAfterSet.size).toEqual(1)

      expect(hashesBefore[0]).not.toEqual(hashesAfter[0])

      // Cleanup to clear tests accounting
      await Transaction.deleteMany({ payout_id: payoutId })
    })

    it("handles a broadcast event, with underpaid fee", async () => {
      // Setup a transaction in database
      const btcFeeDifference = { amount: 1500n, currency: WalletCurrency.Btc }
      const actualFee = calc.add(estimatedFee, btcFeeDifference)

      const broadcastPayload = await addOnChainPaymentLedgerTxns({
        estimatedFee,
        actualFee,
      })
      const { proportionalFee, id: payoutId, txId, vout } = broadcastPayload

      // Run before-broadcast checks
      const txnsBefore = await LedgerFacade.getTransactionsByPayoutId(payoutId)
      if (txnsBefore instanceof Error) throw txnsBefore
      expect(txnsBefore.length).toEqual(2)

      const bankTxns = txnsBefore.filter((txn) => txn.walletId === bankOwnerWalletId)
      expect(bankTxns.length).toEqual(1)
      const bankTxnIdBefore = bankTxns[0].id

      const hashesBefore = txnsBefore.map((txn) => txn.txHash)
      const hashesBeforeSet = new Set(hashesBefore)
      expect(hashesBeforeSet.size).toEqual(1)

      // Register broadcast
      const res = await registerBroadcastedPayout({
        payoutId,
        proportionalFee,
        txId,
        vout,
      })
      expect(res).toBe(true)

      // Idempotency check
      const resRerun = await registerBroadcastedPayout({
        payoutId,
        proportionalFee,
        txId,
        vout,
      })
      expect(resRerun).toBe(true)

      // Run after-broadcast checks
      const txnsAfter = await LedgerFacade.getTransactionsByPayoutId(payoutId)
      if (txnsAfter instanceof Error) throw txnsAfter
      expect(txnsAfter.length).toEqual(3)

      const bankTxnsAfter = txnsAfter.filter((txn) => txn.walletId === bankOwnerWalletId)
      expect(bankTxnsAfter.length).toEqual(2)
      const addedBankTxn = bankTxnsAfter.find((txn) => txn.id !== bankTxnIdBefore)
      if (addedBankTxn === undefined) throw new Error("Expected bankOwner txn not found")

      expect(addedBankTxn.debit).toEqual(Number(btcFeeDifference.amount))

      const hashesAfter = txnsAfter.map((txn) => txn.txHash)
      const hashesAfterSet = new Set(hashesAfter)
      expect(hashesAfterSet.size).toEqual(1)

      expect(hashesBefore[0]).not.toEqual(hashesAfter[0])

      // Cleanup to clear tests accounting
      await Transaction.deleteMany({ payout_id: payoutId })
    })

    it("handles a broadcast event, with overpaid fee", async () => {
      // Setup a transaction in database
      const btcFeeDifference = { amount: 1500n, currency: WalletCurrency.Btc }
      const actualFee = calc.sub(estimatedFee, btcFeeDifference)

      const broadcastPayload = await addOnChainPaymentLedgerTxns({
        estimatedFee,
        actualFee,
      })
      const { proportionalFee, id: payoutId, txId, vout } = broadcastPayload

      // Run before-broadcast checks
      const txnsBefore = await LedgerFacade.getTransactionsByPayoutId(payoutId)
      if (txnsBefore instanceof Error) throw txnsBefore
      expect(txnsBefore.length).toEqual(2)

      const bankTxns = txnsBefore.filter((txn) => txn.walletId === bankOwnerWalletId)
      expect(bankTxns.length).toEqual(1)
      const bankTxnIdBefore = bankTxns[0].id

      const hashesBefore = txnsBefore.map((txn) => txn.txHash)
      const hashesBeforeSet = new Set(hashesBefore)
      expect(hashesBeforeSet.size).toEqual(1)

      // Register broadcast
      const res = await registerBroadcastedPayout({
        payoutId,
        proportionalFee,
        txId,
        vout,
      })
      expect(res).toBe(true)

      // Idempotency check
      const resRerun = await registerBroadcastedPayout({
        payoutId,
        proportionalFee,
        txId,
        vout,
      })
      expect(resRerun).toBe(true)

      // Run after-broadcast checks
      const txnsAfter = await LedgerFacade.getTransactionsByPayoutId(payoutId)
      if (txnsAfter instanceof Error) throw txnsAfter
      expect(txnsAfter.length).toEqual(3)

      const bankTxnsAfter = txnsAfter.filter((txn) => txn.walletId === bankOwnerWalletId)
      expect(bankTxnsAfter.length).toEqual(2)
      const addedBankTxn = bankTxnsAfter.find((txn) => txn.id !== bankTxnIdBefore)
      if (addedBankTxn === undefined) throw new Error("Expected bankOwner txn not found")

      expect(addedBankTxn.credit).toEqual(Number(btcFeeDifference.amount))

      const hashesAfter = txnsAfter.map((txn) => txn.txHash)
      const hashesAfterSet = new Set(hashesAfter)
      expect(hashesAfterSet.size).toEqual(1)

      expect(hashesBefore[0]).not.toEqual(hashesAfter[0])

      // Cleanup to clear tests accounting
      await Transaction.deleteMany({ payout_id: payoutId })
    })

    it("handles failed pending fee reconciliation and then retry", async () => {
      // Setup a transaction in database
      const btcFeeDifference = { amount: 1500n, currency: WalletCurrency.Btc }
      const actualFee = calc.add(estimatedFee, btcFeeDifference)

      const broadcastPayload = await addOnChainPaymentLedgerTxns({
        estimatedFee,
        actualFee,
      })
      const { proportionalFee, id: payoutId, txId, vout } = broadcastPayload

      // Run before-broadcast checks
      const txnsBefore = await LedgerFacade.getTransactionsByPayoutId(payoutId)
      if (txnsBefore instanceof Error) throw txnsBefore
      expect(txnsBefore.length).toEqual(2)

      const bankTxns = txnsBefore.filter((txn) => txn.walletId === bankOwnerWalletId)
      expect(bankTxns.length).toEqual(1)
      const bankTxnIdBefore = bankTxns[0].id

      const hashesBefore = txnsBefore.map((txn) => txn.txHash)
      const hashesBeforeSet = new Set(hashesBefore)
      expect(hashesBeforeSet.size).toEqual(1)

      // Register broadcast with failure
      const spy = jest
        .spyOn(LedgerFacadeSendImpl, "getTransactionsByPayoutId")
        .mockImplementation(async () => new UnknownLedgerError())

      const res = await registerBroadcastedPayout({
        payoutId,
        proportionalFee,
        txId,
        vout,
      })
      expect(res).toBeInstanceOf(UnknownLedgerError)

      // Idempotency check
      const resRerun = await registerBroadcastedPayout({
        payoutId,
        proportionalFee,
        txId,
        vout,
      })
      expect(resRerun).toBeInstanceOf(UnknownLedgerError)

      spy.mockRestore()

      // Run after-broadcast checks
      const txnsAfter = await LedgerFacade.getTransactionsByPayoutId(payoutId)
      if (txnsAfter instanceof Error) throw txnsAfter
      expect(txnsAfter.length).toEqual(2)

      const bankTxnsAfter = txnsAfter.filter((txn) => txn.walletId === bankOwnerWalletId)
      expect(bankTxnsAfter.length).toEqual(1)

      const hashesAfter = txnsAfter.map((txn) => txn.txHash)
      const hashesAfterSet = new Set(hashesAfter)
      expect(hashesAfterSet.size).toEqual(1)

      expect(hashesBefore[0]).not.toEqual(hashesAfter[0])

      // Retry registering broadcast event
      const resRetry = await registerBroadcastedPayout({
        payoutId,
        proportionalFee,
        txId,
        vout,
      })
      expect(resRetry).toBe(true)

      const txnsAfterRetry = await LedgerFacade.getTransactionsByPayoutId(payoutId)
      if (txnsAfterRetry instanceof Error) throw txnsAfterRetry
      expect(txnsAfterRetry.length).toEqual(3)

      const bankTxnsAfterRetry = txnsAfterRetry.filter(
        (txn) => txn.walletId === bankOwnerWalletId,
      )
      expect(bankTxnsAfterRetry.length).toEqual(2)
      const addedBankTxn = bankTxnsAfterRetry.find((txn) => txn.id !== bankTxnIdBefore)
      if (addedBankTxn === undefined) throw new Error("Expected bankOwner txn not found")

      expect(addedBankTxn.debit).toEqual(Number(btcFeeDifference.amount))

      const hashesAfterRetry = txnsAfter.map((txn) => txn.txHash)
      const hashesAfterRetrySet = new Set(hashesAfterRetry)
      expect(hashesAfterRetrySet.size).toEqual(1)

      expect(hashesBefore[0]).not.toEqual(hashesAfterRetry[0])
      expect(hashesAfter[0]).toEqual(hashesAfterRetry[0])

      // Cleanup to clear tests accounting
      await Transaction.deleteMany({ payout_id: payoutId })
    })
  })
})
