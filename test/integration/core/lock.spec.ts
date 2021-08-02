import { redis } from "@services/redis"
import { sleep } from "@core/utils"
import { baseLogger } from "@services/logger"
import { redlock, getResource, lockExtendOrThrow } from "@core/lock"

const uid = "1234"

const checkLockExist = (client) =>
  new Promise((resolve) =>
    client.get(getResource(uid), (err, res) => {
      resolve(!!res)
    }),
  )

describe("Lock", () => {
  describe("redlock", () => {
    it("return value is passed with a promise", async () => {
      const result = await redlock({ path: uid, logger: baseLogger }, () => {
        return "r"
      })

      expect(result).toBe("r")
    })

    it("use lock if this exist", async () => {
      const result = await redlock({ path: uid, logger: baseLogger }, (lock) => {
        return redlock({ path: uid, logger: baseLogger, lock }, () => {
          return "r"
        })
      })

      expect(result).toBe("r")
    })

    it("relocking fail if lock is not passed down the tree", async () => {
      await expect(
        redlock({ path: uid, logger: baseLogger }, async function () {
          return await redlock({ path: uid, logger: baseLogger }, () => {
            return "r"
          })
        }),
      ).rejects.toThrow()
    })

    it("second loop start after first loop has ended", async () => {
      const order: number[] = []

      await Promise.all([
        redlock({ path: uid, logger: baseLogger }, async function () {
          order.push(1)
          await sleep(1000)
          order.push(2)
        }),
        redlock({ path: uid, logger: baseLogger }, async function () {
          order.push(3)
          await sleep(1000)
          order.push(4)
        }),
      ])

      expect(order).toStrictEqual([1, 2, 3, 4])
    })

    it("throwing error releases the lock", async () => {
      try {
        await redlock({ path: uid, logger: baseLogger }, async function () {
          expect(await checkLockExist(redis)).toBeTruthy()
          await sleep(500)
          throw Error("dummy error")
        })
      } catch (err) {
        baseLogger.info(`error is being catched ${err}`)
      }

      expect(await checkLockExist(redis)).toBeFalsy()
    })
  })

  describe("lockExtendOrThrow", () => {
    it("fail to extend after the lock timed out", async () => {
      await redlock({ path: uid, logger: baseLogger }, async function (lock) {
        await sleep(11000)

        try {
          await lockExtendOrThrow({ lock, logger: baseLogger }, () => {
            // this should not execute
            expect(true).toBeFalsy()
          })
        } catch (err) {
          // this should run
          expect(true).toBeTruthy()
        }
      })
    })

    it("can extend before the lock timed out", async () => {
      await redlock({ path: uid, logger: baseLogger }, async function (lock) {
        await sleep(100)

        const promise = lockExtendOrThrow({ lock, logger: baseLogger }, () => {
          // this should not execute
          expect(true).toBeTruthy()

          return 1
        })

        expect(await promise).toBe(1)
      })
    })

    it("if lock has expired and another thread has take it, it should not extend", async () => {
      await Promise.race([
        redlock({ path: uid, logger: baseLogger }, async function (lock) {
          await sleep(12000)
          // lock should have expired at that point

          try {
            await lockExtendOrThrow({ lock, logger: baseLogger }, () => {
              // this should not execute
              expect(true).toBeFalsy()
            })
          } catch (err) {
            expect(true).toBeTruthy()
          }
        }),

        new Promise(async (accept) => {
          // first lock should have expired
          await sleep(10500)
          await redlock({ path: uid, logger: baseLogger }, async function () {
            expect(await checkLockExist(redis)).toBeTruthy()
            expect(true).toBeTruthy()
            await sleep(2000)
            accept(true)
          })
        }),
      ])
    })
  })
})
