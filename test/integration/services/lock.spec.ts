import { sleep } from "@utils"
import { LockService } from "@services/lock"
import { baseLogger } from "@services/logger"
import { ResourceAttemptsLockServiceError } from "@domain/lock"

describe("Lock", () => {
  describe("lockWalletId", () => {
    it("returns ResourceAttemptsLockServiceError when exceed attempts", async () => {
      const walletId = "walletId" as WalletId
      const lockService = LockService()

      const lock1 = lockService.lockWalletId(
        { walletId, logger: baseLogger },
        async () => {
          await sleep(5000)
          return 1
        },
      )

      const lock2 = lockService.lockWalletId(
        { walletId, logger: baseLogger },
        async () => {
          return 2
        },
      )

      const result = await Promise.race([lock1, lock2])
      expect(result).toBeInstanceOf(ResourceAttemptsLockServiceError)
    })
  })

  describe("lockPaymentHash", () => {
    it("returns ResourceAttemptsLockServiceError when exceed attempts", async () => {
      const paymentHash = "paymentHash" as PaymentHash
      const lockService = LockService()

      const lock1 = lockService.lockPaymentHash(
        { paymentHash, logger: baseLogger },
        async () => {
          await sleep(5000)
          return 1
        },
      )

      const lock2 = lockService.lockPaymentHash(
        { paymentHash, logger: baseLogger },
        async () => {
          return 2
        },
      )

      const result = await Promise.race([lock1, lock2])
      expect(result).toBeInstanceOf(ResourceAttemptsLockServiceError)
    })
  })

  describe("lockOnChainTxHash", () => {
    it("returns ResourceAttemptsLockServiceError when exceed attempts", async () => {
      const txHash = "txHash" as OnChainTxHash
      const lockService = LockService()

      const lock1 = lockService.lockOnChainTxHash(
        { txHash, logger: baseLogger },
        async () => {
          await sleep(5000)
          return 1
        },
      )

      const lock2 = lockService.lockOnChainTxHash(
        { txHash, logger: baseLogger },
        async () => {
          return 2
        },
      )

      const result = await Promise.race([lock1, lock2])
      expect(result).toBeInstanceOf(ResourceAttemptsLockServiceError)
    })
  })
})
