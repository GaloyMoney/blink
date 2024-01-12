import { Redis } from "ioredis"

import { ResourceAttemptsRedlockServiceError } from "@/domain/lock"

import { LockService } from "@/services/lock"
import { redis } from "@/services/redis"

import { sleep } from "@/utils"

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

    it("second loop starts after first loop has ended", async () => {
      const walletId = randomWalletId()

      const order: number[] = []

      const lock1Fn = async () => {
        order.push(1)
        await sleep(500)
        order.push(2)
        return "1st"
      }

      const lock2Fn = async () => {
        order.push(3)
        await sleep(500)
        order.push(4)
        return "2nd"
      }

      await Promise.all([
        lockService.lockWalletId(walletId, lock1Fn),
        lockService.lockWalletId(walletId, lock2Fn),
      ])

      expect(order).toStrictEqual([1, 2, 3, 4])
    })

    it("releases the lock when error is thrown", async () => {
      const walletId = randomWalletId()

      const checkLockExist = (client: Redis) =>
        new Promise((resolve) =>
          client.get(walletId, (err, res) => {
            resolve(!!res)
          }),
        )

      await lockService.lockWalletId(walletId, async () => {
        expect(await checkLockExist(redis)).toBeTruthy()
        await sleep(500)
        throw Error("dummy error")
      })

      expect(await checkLockExist(redis)).toBeFalsy()
    })
  })
})
