import { IHedgingStrategy, HedgingStrategies } from "./IHedgingStrategy"
import { FtxPerpetualSwapStrategy } from "./FtxPerpetualSwapStrategy"
import { OkexPerpetualSwapStrategy } from "./OkexPerpetualSwapStrategy"

export function createHedgingStrategy(
  strategy: HedgingStrategies,
  logger,
): IHedgingStrategy {
  switch (strategy) {
    case HedgingStrategies.FtxPerpetualSwap:
      return new FtxPerpetualSwapStrategy(logger)
      break

    case HedgingStrategies.OkexPerpetualSwap:
      return new OkexPerpetualSwapStrategy(logger)
      break

    default:
      throw new Error("Not implemented!")
      break
  }
}
