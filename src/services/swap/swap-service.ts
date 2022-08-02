import { SwapServiceError } from "@domain/swap/errors"
import { wrapAsyncFunctionsToRunInSpan } from "@services/tracing"

import { LoopService } from "./providers/lightning-labs/loop-service"

export const SwapService = (
  loopMacaroon?: string,
  loopTlsCert?: string,
  grpcEndpoint?: string,
): ISwapService => {
  // TODO logic to choose the correct LND server
  // isActive and lowest priority and has outbound liquity

  // TODO logic to choose the correct onChain address for the swap out destination
  // lndnode ["onChain"]

  let loopService
  if (loopMacaroon && loopTlsCert && grpcEndpoint) {
    loopService = LoopService(loopMacaroon, loopTlsCert, grpcEndpoint)
  } else {
    loopService = LoopService()
  }
  const healthCheck = async () => {
    try {
      const isServiceUp = await loopService.healthCheck()
      if (isServiceUp) return true
      return false
    } catch (e) {
      return false
    }
  }

  const swapOut = async (amount) => {
    try {
      const resp = await loopService.swapOut(amount)
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
