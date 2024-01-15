import { sleep } from "@/utils"
import { redlock } from "@/services/lock"

import { redis } from "@/services/redis"
import { baseLogger } from "@/services/logger"

const walletId = "1234"

/* eslint @typescript-eslint/ban-ts-comment: "off" */
// @ts-ignore-next-line no-implicit-any error
const checkLockExist = (client) =>
  new Promise((resolve) =>
    // @ts-ignore-next-line no-implicit-any error
    client.get(walletId, (err, res) => {
      resolve(!!res)
    }),
  )

describe("Redlock", () => {
  it("second loop start after first loop has ended", async () => {
    const order: number[] = []

    await Promise.all([
      redlock({
        path: walletId,
        asyncFn: async () => {
          order.push(1)
          await sleep(500)
          order.push(2)
        },
      }),
      redlock({
        path: walletId,
        asyncFn: async () => {
          order.push(3)
          await sleep(500)
          order.push(4)
        },
      }),
    ])

    expect(order).toStrictEqual([1, 2, 3, 4])
  })

  it("throwing error releases the lock", async () => {
    try {
      await redlock({
        path: walletId,
        asyncFn: async () => {
          expect(await checkLockExist(redis)).toBeTruthy()
          await sleep(500)
          throw Error("dummy error")
        },
      })
    } catch (err) {
      baseLogger.info(`error is being caught ${err}`)
    }

    expect(await checkLockExist(redis)).toBeFalsy()
  })
})
