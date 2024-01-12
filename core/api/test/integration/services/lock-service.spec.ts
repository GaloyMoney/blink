import { sleep } from "@/utils"
import { LockService } from "@/services/lock"

import { ResourceAttemptsRedlockServiceError } from "@/domain/lock"
import { randomWalletId } from "test/helpers"

const lockService = LockService()

describe("LockService", () => {
  describe("lockWalletId", () => {
    it("returns value from lock", async () => {
      const walletId = randomWalletId()

      const lockFn = async () => {
        return 1
      }

      const result = await lockFn()
      expect(result).toEqual(1)

      const resultFromLock = await lockService.lockWalletId(walletId, lockFn)
      expect(result).toEqual(resultFromLock)
    })

    it("fails for multiple calls on locked resource", async () => {
      const walletId = randomWalletId()

      const slowLock = lockService.lockWalletId(walletId, async () => {
        await sleep(5000)
        return 1
      })

      const fastLock = lockService.lockWalletId(walletId, async () => {
        return 2
      })

      const result = await Promise.race([slowLock, fastLock])
      expect(result).toBeInstanceOf(ResourceAttemptsRedlockServiceError)
    })
  })
})
