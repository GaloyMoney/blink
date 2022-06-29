import { ISwapProvider } from "@services/swap/index.types"

import { loopRestClient } from "./loop-rest-client"

const loopSwapProvider: ISwapProvider = {
  swapOut: async (amount) => {
    try {
      const resp = await loopRestClient.loopOut(amount)
      return JSON.stringify(resp.data)
    } catch (e) {
      return e.toString()
    }
  },
}

export default loopSwapProvider
