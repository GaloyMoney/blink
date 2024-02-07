import { sleep } from "@/utils"

export const waitFor = async (f: () => Promise<unknown>) => {
  let res
  while (!(res = await f())) await sleep(500)
  return res
}
