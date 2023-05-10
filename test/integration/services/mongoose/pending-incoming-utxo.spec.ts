import { toSats } from "@domain/bitcoin"
import {
  CouldNotFindPendingIncomingOnChainUTXOError,
  UnknownRepositoryError,
} from "@domain/errors"
import { PendingIncomingUTXORepository } from "@services/mongoose"
import { PendingIncomingUTXO } from "@services/mongoose/schema"

describe("PendingIncomingUTXORepository", () => {
  const repo = PendingIncomingUTXORepository()

  describe("persistNew", () => {
    it("should persist a new pending tx and return it", async () => {
      const newPendingIncomingTransaction = {
        address: "address1" as OnChainAddress,
        amount: toSats(1000),
        txHash: "txHash1" as OnChainTxHash,
        vout: 0,
      }

      const result = await repo.persistNew(newPendingIncomingTransaction)
      if (result instanceof Error) throw result

      expect(result).toMatchObject(newPendingIncomingTransaction)
      expect(result.id).toBeTruthy()
      expect(result.createdAt).toBeInstanceOf(Date)

      const savedRecords = await repo.listByAddresses(["address1" as OnChainAddress])
      if (savedRecords instanceof Error) throw savedRecords
      expect(savedRecords.length).toBe(1)
      expect(savedRecords[0]).toMatchObject(newPendingIncomingTransaction)
    })

    it("should return UnknownRepositoryError when an error occurs during persistence", async () => {
      const newPendingIncomingTransaction = {
        address: "address2" as OnChainAddress,
        amount: toSats(2000),
        txHash: "txHas2" as OnChainTxHash,
        vout: 0,
      }

      jest
        .spyOn(PendingIncomingUTXO.prototype, "save")
        .mockRejectedValueOnce(new Error("Test error"))
      const result = await repo.persistNew(newPendingIncomingTransaction)

      expect(result).toBeInstanceOf(UnknownRepositoryError)
    })
  })

  describe("listByAddresses", () => {
    it("should return a list of PendingIncomingOnChainTransactions for given addresses", async () => {
      const newPendingIncomingTransaction1 = {
        address: "listByAddresses1" as OnChainAddress,
        amount: toSats(1000),
        txHash: "txHash1" as OnChainTxHash,
        vout: 0,
      }

      const newPendingIncomingTransaction2 = {
        address: "listByAddresses2" as OnChainAddress,
        amount: toSats(2000),
        txHash: "txHash2" as OnChainTxHash,
        vout: 0,
      }

      const result1 = await repo.persistNew(newPendingIncomingTransaction1)
      if (result1 instanceof Error) throw result1
      const result2 = await repo.persistNew(newPendingIncomingTransaction2)
      if (result2 instanceof Error) throw result2

      const addresses = ["listByAddresses1", "listByAddresses2"] as OnChainAddress[]
      const results = await repo.listByAddresses(addresses)
      if (results instanceof Error) throw results

      expect(results.length).toBe(2)
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining(newPendingIncomingTransaction1),
          expect.objectContaining(newPendingIncomingTransaction2),
        ]),
      )
    })

    it("should return CouldNotFindPendingIncomingOnChainUTXOError when not found for the given addresses", async () => {
      const results = await repo.listByAddresses([
        "nonexistent_address1",
        "nonexistent_address2",
      ] as OnChainAddress[])
      expect(results).toBeInstanceOf(CouldNotFindPendingIncomingOnChainUTXOError)
    })
  })

  describe("remove", () => {
    it("should remove the pending transaction and return true", async () => {
      const newPendingIncomingTransaction = {
        address: "addressForRemove" as OnChainAddress,
        amount: toSats(1000),
        txHash: "txHashForRemove" as OnChainTxHash,
        vout: 0,
      }

      const result = await repo.persistNew(newPendingIncomingTransaction)
      if (result instanceof Error) throw result

      const removeResult = await repo.remove(result)
      if (removeResult instanceof Error) throw removeResult

      expect(removeResult).toBe(true)

      const listResult = await repo.listByAddresses([result.address])
      expect(listResult).toBeInstanceOf(CouldNotFindPendingIncomingOnChainUTXOError)
    })

    it("should return CouldNotFindPendingIncomingOnChainUTXOError if the transaction to be removed is not found", async () => {
      const fakeTransaction = {
        id: "645af85b98aa29dc285d4c9d" as PendingIncomingOnChainTransactionId,
        address: "nonexistent_address" as OnChainAddress,
        amount: toSats(1000),
        txHash: "nonexistent_txHash" as OnChainTxHash,
        vout: 0,
        createdAt: new Date(),
      }

      const result = await repo.remove(fakeTransaction)

      expect(result).toBeInstanceOf(CouldNotFindPendingIncomingOnChainUTXOError)
    })

    it("should return UnknownRepositoryError when an error occurs during the removal", async () => {
      const newPendingIncomingTransaction = {
        address: "addressForRemoveError" as OnChainAddress,
        amount: toSats(1000),
        txHash: "txHashForRemoveError" as OnChainTxHash,
        vout: 0,
      }

      const result = await repo.persistNew(newPendingIncomingTransaction)
      if (result instanceof Error) throw result

      jest
        .spyOn(PendingIncomingUTXO, "deleteOne")
        .mockRejectedValueOnce(new Error("Test error"))

      const removeResult = await repo.remove(result)
      expect(removeResult).toBeInstanceOf(UnknownRepositoryError)
    })
  })
})
