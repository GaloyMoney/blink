import { sleep } from "@utils"

export const waitFor = async (f) => {
  let res
  while (!(res = await f())) await sleep(500)
  return res
}

export const waitForWithCount = async (f, max) => {
  let count = 0
  let res
  while (!(res = await f()) && count < max) {
    await sleep(500)
    count++
  }
  return res
}
