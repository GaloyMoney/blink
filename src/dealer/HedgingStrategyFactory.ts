import { HedgingStrategy, HedgingStrategies } from "./HedgingStrategyTypes"
import { FtxPerpetualSwapStrategy } from "./FtxPerpetualSwapStrategy"
import { OkexPerpetualSwapStrategy } from "./OkexPerpetualSwapStrategy"

export function createHedgingStrategy(
  strategy: HedgingStrategies,
  logger,
): HedgingStrategy {
  switch (strategy) {
    case HedgingStrategies.FtxPerpetualSwap:
      return new FtxPerpetualSwapStrategy(logger)

    case HedgingStrategies.OkexPerpetualSwap:
      return new OkexPerpetualSwapStrategy(logger)

    default:
      throw new Error("Not implemented!")
  }
}
