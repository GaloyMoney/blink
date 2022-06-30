import { ISwapService } from "@domain/swap/index.types"

// @todo maybe move to app layer and pass in array of providers
import SwapProvider from "./providers/lightning-labs/loop-swap-provider"

export const SwapService: ISwapService = {
  swapOut: async (amount) => {
    // @todo iterate providers and find best fee
    // const swapProviders = getSwapConfig().swapProviders
    const swapResult = await SwapProvider.swapOut(amount)
    return swapResult
  },
}
