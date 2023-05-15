import { toSats } from "@domain/bitcoin"
import { DisplayCurrency } from "@domain/fiat"
import { WalletCurrency } from "@domain/shared"
import {
  CouldNotFindWalletOnChainPendingReceiveError,
  UnknownRepositoryError,
} from "@domain/errors"

import { WalletOnChainPendingReceiveRepository } from "@services/mongoose"
import { WalletOnChainPendingReceive } from "@services/mongoose/schema"

describe("WalletOnChainPendingReceiveRepository", () => {
  const repo = WalletOnChainPendingReceiveRepository()
  const walletId = "wallet1" as WalletId
  const newPendingIncomingTransaction: PersistWalletOnChainPendingReceiveArgs = {
    walletId,
    initiationVia: {
      type: "onchain",
      address: "address1" as OnChainAddress,
    },
    settlementVia: {
      type: "onchain",
      transactionHash: "txHash1" as OnChainTxHash,
      vout: 1 as OnChainTxVout,
    },
    settlementAmount: toSats(10000),
    settlementFee: toSats(2000),
    settlementCurrency: WalletCurrency.Btc,
    settlementDisplayAmount: "1.00",
    settlementDisplayFee: "0.02",
    settlementDisplayPrice: {
      base: 27454545454n,
      offset: 12n,
      displayCurrency: DisplayCurrency.Usd,
      walletCurrency: WalletCurrency.Btc,
    },
    createdAt: new Date(Date.now()),
  }

  describe("persistNew", () => {
    it("should persist a new pending tx and return it", async () => {
      const result = await repo.persistNew(newPendingIncomingTransaction)
      if (result instanceof Error) throw result

      expect(result).toMatchObject(newPendingIncomingTransaction)
      expect(result.id).toBeTruthy()
      expect(result.createdAt).toBeInstanceOf(Date)

      const savedRecords = await repo.listByWalletIds({ walletIds: [walletId] })
      if (savedRecords instanceof Error) throw savedRecords
      expect(savedRecords.length).toBe(1)
      expect(savedRecords[0]).toMatchObject(newPendingIncomingTransaction)
    })

    it("should return UnknownRepositoryError when an error occurs during persistence", async () => {
      jest
        .spyOn(WalletOnChainPendingReceive.prototype, "save")
        .mockRejectedValueOnce(new Error("Test error"))
      const result = await repo.persistNew(newPendingIncomingTransaction)

      expect(result).toBeInstanceOf(UnknownRepositoryError)
    })
  })

  describe("listByAddresses", () => {
    const walletId = "walletlListByAddresses1" as WalletId
    it("should return a list of PendingIncomingOnChainTransactions for given wallet", async () => {
      const newPendingIncomingTransaction1: PersistWalletOnChainPendingReceiveArgs = {
        ...newPendingIncomingTransaction,
        walletId,
      }
      const newPendingIncomingTransaction2: PersistWalletOnChainPendingReceiveArgs = {
        ...newPendingIncomingTransaction,
        walletId,
        initiationVia: {
          type: "onchain",
          address: "address2" as OnChainAddress,
        },
        settlementVia: {
          type: "onchain",
          transactionHash: "txHash2" as OnChainTxHash,
          vout: 2 as OnChainTxVout,
        },
        createdAt: new Date(Date.now()),
      }

      const result1 = await repo.persistNew(newPendingIncomingTransaction1)
      if (result1 instanceof Error) throw result1
      const result2 = await repo.persistNew(newPendingIncomingTransaction2)
      if (result2 instanceof Error) throw result2

      const results = await repo.listByWalletIds({ walletIds: [walletId] })
      if (results instanceof Error) throw results

      expect(results.length).toBe(2)
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining(newPendingIncomingTransaction1),
          expect.objectContaining(newPendingIncomingTransaction2),
        ]),
      )
    })

    it("should return CouldNotFindWalletOnChainPendingReceiveError when not found for the given wallet", async () => {
      const results = await repo.listByWalletIds({
        walletIds: ["walletWithoutTxs" as WalletId],
      })
      expect(results).toBeInstanceOf(CouldNotFindWalletOnChainPendingReceiveError)
    })
  })

  describe("remove", () => {
    const walletId = "walletlRemove1" as WalletId
    it("should remove the pending transaction and return true", async () => {
      const newPendingIncomingTransaction1: PersistWalletOnChainPendingReceiveArgs = {
        ...newPendingIncomingTransaction,
        walletId,
      }
      const result = await repo.persistNew(newPendingIncomingTransaction1)
      if (result instanceof Error) throw result

      const removeResult = await repo.remove({
        walletId,
        transactionHash: result.settlementVia.transactionHash,
        vout: 1,
      })
      if (removeResult instanceof Error) throw removeResult

      expect(removeResult).toBe(true)

      const listResult = await repo.listByWalletIds({ walletIds: [walletId] })
      expect(listResult).toBeInstanceOf(CouldNotFindWalletOnChainPendingReceiveError)
    })

    it("should return CouldNotFindWalletOnChainPendingReceiveError if the transaction to be removed is not found", async () => {
      const result = await repo.remove({
        walletId,
        transactionHash: "nonexistent_txHash" as OnChainTxHash,
        vout: 1,
      })

      expect(result).toBeInstanceOf(CouldNotFindWalletOnChainPendingReceiveError)
    })

    it("should return UnknownRepositoryError when an error occurs during the removal", async () => {
      const newPendingIncomingTransaction1: PersistWalletOnChainPendingReceiveArgs = {
        ...newPendingIncomingTransaction,
        walletId,
      }

      const result = await repo.persistNew(newPendingIncomingTransaction1)
      if (result instanceof Error) throw result

      jest
        .spyOn(WalletOnChainPendingReceive, "deleteOne")
        .mockRejectedValueOnce(new Error("Test error"))

      const removeResult = await repo.remove({
        walletId,
        transactionHash: result.settlementVia.transactionHash,
        vout: 1,
      })
      expect(removeResult).toBeInstanceOf(UnknownRepositoryError)
    })
  })
})
