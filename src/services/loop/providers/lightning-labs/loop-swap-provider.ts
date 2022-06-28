import { ISwapProvider } from "@services/loop/index.types"

import { loopRestClient } from "./loop-rest-client"

const loopSwapProvider: ISwapProvider = {
  loopOut: async (amount) => {
    try {
      const resp = await loopRestClient.loopOut(amount)
      return JSON.stringify(resp.data)
    } catch (e) {
      return e.toString()
    }
  },
}

export default loopSwapProvider
