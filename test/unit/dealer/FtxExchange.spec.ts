import { redis } from "src/redis"
import { baseLogger } from "src/logger"
import { SupportedExchange, SupportedInstrument } from "src/dealer/ExchangeConfiguration"
import { FtxExchangeConfiguration } from "src/dealer/FtxExchangeConfiguration"
import { FtxExchange } from "src/dealer/FtxExchange"
import {
  WithdrawParameters,
  CreateOrderParameters,
  SupportedChain,
  TradeCurrency,
  TradeSide,
  TradeType,
  ApiError,
  OrderStatus,
} from "src/dealer/ExchangeTradingType"
import { AssertionError } from "assert"

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

const falsyArgs = [null, undefined, NaN, 0, "", false]

describe("FtxExchange", () => {
  describe("constructor", () => {
    it("should return a FtxExchangeConfiguration", async () => {
      const exchangeConfig = new FtxExchangeConfiguration()
      const exchange = new FtxExchange(exchangeConfig, baseLogger)
      expect(exchange).toBeInstanceOf(FtxExchange)
    })

    it("should use Ftx exchange id", async () => {
      const exchangeConfig = new FtxExchangeConfiguration()
      const exchange = new FtxExchange(exchangeConfig, baseLogger)
      expect(exchange.exchangeId).toBe(SupportedExchange.FTX)
    })

    it("should use Ftx perpetual swap", async () => {
      const exchangeConfig = new FtxExchangeConfiguration()
      const exchange = new FtxExchange(exchangeConfig, baseLogger)
      expect(exchange.instrumentId).toBe(SupportedInstrument.FTX_PERPETUAL_SWAP)
    })
  })

  describe("getAccountAndPositionRisk", () => {
    it("should throw when argument is falsy", async () => {
      const exchangeConfig = new FtxExchangeConfiguration()
      const exchange = new FtxExchange(exchangeConfig, baseLogger)
      for (const arg of falsyArgs) {
        if (arg !== 0) {
          const result = await exchange.getAccountAndPositionRisk(arg)
          expect(result.ok).toBeFalsy()
          if (!result.ok) {
            expect(result.error.message).toEqual(ApiError.MISSING_PARAMETERS)
          }
        }
      }
    })

    it("should throw when argument is non positive", async () => {
      const exchangeConfig = new FtxExchangeConfiguration()
      const exchange = new FtxExchange(exchangeConfig, baseLogger)
      const invalidQuantity = [0, -1]
      for (const arg of invalidQuantity) {
        const result = await exchange.getAccountAndPositionRisk(arg)
        expect(result.ok).toBeFalsy()
        if (!result.ok) {
          expect(result.error.message).toEqual(ApiError.NON_POSITIVE_PRICE)
        }
      }
    })

    it("should throw when bad response from privateGetAccount api call", async () => {
      const exchangeConfig = new FtxExchangeConfiguration()
      const exchange = new FtxExchange(exchangeConfig, baseLogger)
      // need a mock up of ccxt privateGetAccount()
      // to cover the this.exchange.privateGetAccount()
      expect(exchange).toBeInstanceOf(FtxExchange)
    })
  })

  describe("getInstrumentDetails", () => {
    it(`should return failed result with not implemented error`, async () => {
      const exchangeConfig = new FtxExchangeConfiguration()
      const exchange = new FtxExchange(exchangeConfig, baseLogger)
      const result = await exchange.getInstrumentDetails()
      expect(result.ok).toBeFalsy()
      if (!result.ok) {
        expect(result.error.message).toEqual(ApiError.NOT_IMPLEMENTED)
      }
    })
  })
})
