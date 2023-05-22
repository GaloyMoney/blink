import {
  addPendingTransaction,
  addSettledTransaction,
  getLastOnChainAddress,
} from "@app/wallets"

import { WalletCurrency } from "@domain/shared"
import { toLiabilitiesWalletId } from "@domain/ledger"

import { WalletOnChainPendingReceive } from "@services/mongoose/schema"
import { Transaction } from "@services/ledger/schema"

import { randomAccount, addNewWallet, generateHash } from "test/helpers"

const VOUT_0 = 0 as OnChainTxVout
const VOUT_1 = 1 as OnChainTxVout

let walletId: WalletId
let address: OnChainAddress

beforeAll(async () => {
  const accountId = (await randomAccount()).id

  const wallet = await addNewWallet({
    accountId,
    currency: WalletCurrency.Btc,
  })
  if (wallet instanceof Error) throw wallet
  walletId = wallet.id

  const addressResult = await getLastOnChainAddress(walletId)
  if (addressResult instanceof Error) throw addressResult
  address = addressResult
})

const getRandomBtcAmountForOnchain = (): BtcPaymentAmount => {
  const floor = 10_000
  const amount = floor + Math.round(Math.random() * floor)
  return { amount: BigInt(amount), currency: WalletCurrency.Btc }
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
  })
})
