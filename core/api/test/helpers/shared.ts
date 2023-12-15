import { sleep } from "@/utils"

export const waitFor = async (f: () => Promise<unknown>) => {
  let res
  while (!(res = await f())) await sleep(500)
  return res
}

export const waitForNoErrorWithCount = async (f: () => Promise<Error>, max: number) => {
  let count = 0
  let res = new Error()
  while (res instanceof Error && count < max) {
    res = await f()
    await sleep(500)
    count++
  }
  return res
}
