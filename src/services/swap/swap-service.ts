import { getSwapConfig } from "@config"

import SwapProvider from "./providers/lightning-labs/loop-swap-provider"

export const swapOut = async () => {
  // const outboundLiquidityBalance = 1 // @todo get this from LND
  // @todo - Threshold logic here
  // if (outboundLiquidityBalance > maxOutboundLiquidityBalance) { }
  // @todo - add double entry book-keeping code for fees

  const swapOutAmount = getSwapConfig().swapOutAmount
  // const swapProviders = getSwapConfig().swapProviders // @todo iterate providers and find best fee
  const resp = await SwapProvider.swapOut(swapOutAmount)
  return resp
}
