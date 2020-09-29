/**
 * @jest-environment node
 */

import {disposer, quit, getResource} from "../lock"
const using = require('bluebird').using;
import { sleep } from "../utils"
const redis = require('redis')

const uid = "1234"

afterAll(async () => {
  await quit()
});


it('return value from using are passed with a promise', async () => {
  const result = await using(disposer(uid), function(lock) {
    return "r"
  });

  expect (result).toBe("r")
})

it('second loop start after first loop has ended', async () => {
  let order: number[] = []

  await Promise.all([
    using(disposer(uid), async function(lock) {
      order.push(1)
      await sleep(1000)
      order.push(2)
    }),
    using(disposer(uid), async function(lock) {
      order.push(3)
      await sleep(1000)
      order.push(4)
    })
  ])

  expect(order).toStrictEqual([1, 2, 3, 4])
})

it('throwing error releases the lock', async () => {
  const client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_IP)

  const exceptLockToBe = (fn) => client.get(getResource(uid), (err, res) => {
    console.log({res})
    fn(res)
  });

  try {
    await using(disposer(uid), async function(lock) {  
      exceptLockToBe(res => expect(res).toBeTruthy())
      await sleep(500)
      throw Error("dummy error")
    });
  } catch (err) {
    console.log(`error is being catched ${err}`)
  }

  exceptLockToBe(res => expect(res).toBeFalsy())

  // TODO: properly use callback to avoid sleep
  await sleep(500)
  client.quit()
})