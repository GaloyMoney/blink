import { SwapServiceError } from "@domain/swap/errors"

import { LoopService } from "./providers/lightning-labs/loop-service"

export const SwapService = (): ISwapService => {
  const healthCheck = async () => {
    try {
      const isServiceUp = await LoopService().healthCheck()
      if (isServiceUp) return true
      return false
    } catch (e) {
      return false
    }
  }

  const swapOut = async (amount) => {
    try {
      const resp = await LoopService().swapOut(amount)
      return resp
    } catch (e) {
      return e as SwapServiceError
    }
  }

  const swapListener = () => {
    const listener = LoopService().swapListener()
    // listener.on("data", (response) => {
    //   // TODO A response was received from the server.
    //   console.log(response)
    // })
    // listener.on("status", (status) => {
    //   // TODO The current status of the stream.
    //   console.log(status)
    // })
    // listener.on("end", () => {
    //   // TODO The server has closed the stream.
    // })
    return listener
  }

  return {
    healthCheck,
    swapOut,
    swapListener,
  }
}
