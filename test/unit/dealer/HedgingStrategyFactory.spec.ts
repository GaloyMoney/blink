import { redis } from "src/redis"
import { baseLogger } from "src/logger"
import { HedgingStrategies } from "src/dealer/HedgingStrategyTypes"
import { createHedgingStrategy } from "src/dealer/HedgingStrategyFactory"
import { FtxPerpetualSwapStrategy } from "src/dealer/FtxPerpetualSwapStrategy"
import { OkexPerpetualSwapStrategy } from "src/dealer/OkexPerpetualSwapStrategy"
import { SupportedExchange } from "src/dealer/ExchangeConfiguration"

beforeAll(async () => {
  // avoids to use --forceExit and the need of a running redis
  redis.disconnect()

  // Init exchange secrets
  for (const exchangeId in SupportedExchange) {
    process.env[`${exchangeId.toUpperCase()}_KEY`] = exchangeId
    process.env[`${exchangeId.toUpperCase()}_SECRET`] = exchangeId
    process.env[`${exchangeId.toUpperCase()}_PASSWORD`] = exchangeId
  }
})

describe("HedgingStrategyFactory", () => {
  describe("createHedgingStrategy", () => {
    it("should return a FtxPerpetualSwap", async () => {
      const strategy = createHedgingStrategy(
        HedgingStrategies.FtxPerpetualSwap,
        baseLogger,
      )

      expect(strategy).toBeInstanceOf(FtxPerpetualSwapStrategy)
    })

    it("should return a OkexPerpetualSwapStrategy", async () => {
      const strategy = createHedgingStrategy(
        HedgingStrategies.OkexPerpetualSwap,
        baseLogger,
      )

      expect(strategy).toBeInstanceOf(OkexPerpetualSwapStrategy)
    })

    it("should throw and Error", async () => {
      expect(() =>
        createHedgingStrategy(HedgingStrategies.OkexInverseFutures, baseLogger),
      ).toThrowError()
    })
  })
})
