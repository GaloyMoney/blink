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
    return listener
  }

  return {
    healthCheck,
    swapOut,
    swapListener,
  }
}
