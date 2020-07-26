/**
 * @jest-environment node
 */

import {disposer, quit} from "../lock"
const using = require('bluebird').using;
import { sleep } from "../utils"

const uid = "1234"

afterAll(async () => {
  quit()
});

it('I can acquired a lock', async () => {
  await using(disposer(uid), function(lock) {
    console.log("lock acquired")
  });
})

it('second loop start after first loop has ended', async () => {
  await Promise.all([
    using(disposer(uid), async function(lock) {
      console.log("loop 1, locked acquired")
      await sleep(1000)
      console.log("loop 1 end")
    }),
    using(disposer(uid), async function(lock) {
      console.log("loop 2, locked acquired")
      await sleep(1000)
      console.log("loop 2 end")
    })  
  ])
})