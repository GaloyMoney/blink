import { SwapServiceError } from "@domain/swap/errors"
import { wrapAsyncFunctionsToRunInSpan } from "@services/tracing"

import { LoopUtils } from "./swap-utils"

// TODO rename to LoopService
export const SwapService = (): ISwapService => {
  const loopUtils = LoopUtils()
  const loopService = loopUtils.getActiveLoopService()
  const healthCheck = async () => {
    try {
      const isServiceUp = await loopService.healthCheck()
      if (isServiceUp) return true
      return false
    } catch (e) {
      return false
    }
  }

  const swapOut = async (amount: Satoshis) => {
    try {
      const swapDestAddress = await loopUtils.getSwapDestAddress()
      if (swapDestAddress instanceof Error) return swapDestAddress
      const resp = await loopService.swapOut({ amount, swapDestAddress })
      return resp
    } catch (e) {
      return e as SwapServiceError
    }
  }

  const swapListener = () => loopService.swapListener()

  return wrapAsyncFunctionsToRunInSpan({
    namespace: "services.swap",
    fns: {
      healthCheck,
      swapOut,
      swapListener,
    },
  })
}
