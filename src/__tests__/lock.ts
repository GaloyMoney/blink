/**
 * @jest-environment node
 */

import {disposer, quit} from "../lock"
const using = require('bluebird').using;
import { sleep } from "../utils"

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