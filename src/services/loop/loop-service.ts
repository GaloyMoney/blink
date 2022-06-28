import { getLoopConfig } from "@config"

import { ISwapProvider } from "./index.types"

export const loopOut = async () => {
  // const outboundLiquidityBalance = 1 // @todo get this from LND
  // const maxOutboundLiquidityBalance = getLoopConfig().maxOutboundLiquidityBalance
  // @todo - Threshold logic here
  // if (outboundLiquidityBalance > maxOutboundLiquidityBalance) { }
  // @todo - add double entry book-keeping code for fees

  const loopoutAmount = getLoopConfig().loopoutAmount
  const SWAP_PROVIDER = getLoopConfig().loopProvider
  const swapProvider: ISwapProvider = await (await import(`${SWAP_PROVIDER}`)).default // dynamic import
  const resp = await swapProvider.loopOut(loopoutAmount)
  return resp
}
