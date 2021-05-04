/**
 * @jest-environment node
 */

import {redlock, getResource} from "../lock"
import { sleep } from "../utils"
import { baseLogger } from '../logger'
import redis from 'redis'

const uid = "1234"


it('return value are passed with a promise', async () => {
  const result = await redlock({ path: uid, logger: baseLogger }, async function(lock) {
    return "r"
  });

  expect (result).toBe("r")
})

it('use lock if this exist', async () => {
  const result = await redlock({ path: uid, logger: baseLogger }, async function(lock) {

    return redlock({ path: uid, logger: baseLogger, lock }, async function(lock) {
      return "r"
    })

  });

  expect (result).toBe("r")
})

it('relocking fail if lock is not passed down the tree', async () => {
  await expect(
    redlock({ path: uid, logger: baseLogger }, async function(lock) {
  
      return await redlock({ path: uid, logger: baseLogger }, async function(lock) {
        return "r"
      })

    })
  ).rejects.toThrow()
})

it('second loop start after first loop has ended', async () => {
  let order: number[] = []

  await Promise.all([
    redlock({ path: uid, logger: baseLogger }, async function(lock) {
      order.push(1)
      await sleep(1000)
      order.push(2)
    }),
    redlock({ path: uid, logger: baseLogger }, async function(lock) {
      order.push(3)
      await sleep(1000)
      order.push(4)
    })
  ])

  expect(order).toStrictEqual([1, 2, 3, 4])
})

it('throwing error releases the lock', async () => {
  const client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_IP)

  const checkLockExist = () => new Promise((resolve, reject) => 
    client.get(getResource(uid), (err, res) => {
      console.log({res, err})
      resolve(!!res)
  }))

  try {
    await redlock({ path: uid, logger: baseLogger }, async function(lock) {  
      expect(await checkLockExist()).toBeTruthy()
      await sleep(500)
      throw Error("dummy error")
    });
  } catch (err) {
    console.log(`error is being catched ${err}`)
  }

  expect(await checkLockExist()).toBeFalsy()
})

it('fail to extend after the lock timed out', async () => {
  const client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_IP)

  await redlock({ path: uid, logger: baseLogger }, async function(lock) {  
    await sleep(11000)

    lock.extend(1000, async (err, extended_lock) => {
      console.log({err, extended_lock}, "could extend?")
      expect(err.name).toBe("LockError")
    })

  });

})
