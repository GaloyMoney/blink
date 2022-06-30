import { SwapServiceError } from "@domain/swap/errors"
import { ISwapService, SwapOutResult } from "@domain/swap/index.types"

import { loopRestClient } from "./loop-rest-client"

const loopSwapProvider: ISwapService = {
  swapOut: async (amount) => {
    try {
      const resp = await loopRestClient.loopOut(amount)
      // @todo more robust error handling
      if (resp.status !== 200) throw Error(resp.data.message)
      const swapOutResult: SwapOutResult = {
        swapId: resp.data.id,
        swapIdBytes: resp.data.id_bytes,
        htlcAddress: resp.data.htlc_address,
        serverMessage: resp.data.server_message,
      }
      return swapOutResult
    } catch (e) {
      return e as SwapServiceError
    }
  },
}

export default loopSwapProvider
