import { redis } from "src/redis"
import { SupportedExchange, SupportedInstrument } from "src/dealer/ExchangeConfiguration"
import { OkexExchangeConfiguration } from "src/dealer/OkexExchangeConfiguration"
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

beforeAll(async () => {
  // avoids to use --forceExit and the need of a running redis
  redis.disconnect()
})

function getValidFetchDepositAddressResponse() {
  return {
    code: "0",
    data: [
      {
        chain: "BTC-Bitcoin",
        ctAddr: "",
        ccy: "BTC",
        to: "6",
        addr: "32Cx7VgPAFkSDBNJYf1m3WrTHHCLhBXhRN",
        selected: true,
      },
      {
        chain: "BTC-OKExChain_KIP10",
        ctAddr: "",
        ccy: "BTC",
        to: "6",
        addr: "0x81d0b07d45659f333207632dc113a",
        selected: false,
      },
      {
        chain: "BTC-OKExChain",
        ctAddr: "",
        ccy: "BTC",
        to: "6",
        addr: "0x81d0b07d45659f333207632dc113a",
        selected: false,
      },
      {
        chain: "BTC-ERC20",
        ctAddr: "5807cf",
        ccy: "BTC",
        to: "6",
        addr: "0x81d0b07d45659f333207632dc113a",
        selected: false,
      },
    ],
    msg: "",
  }
}

function getProcessedFetchDepositAddressResponse() {
  const response = getValidFetchDepositAddressResponse()
  const chain = response.data[0].chain
  const currency = response.data[0].ccy
  const address = response.data[0].addr
  return {
    originalResponseAsIs: response,
    chain: chain,
    currency: currency,
    address: address,
  }
}

function getValidWithdrawValidateInput(): WithdrawParameters {
  const args: WithdrawParameters = {
    currency: TradeCurrency.BTC,
    quantity: 1,
    address: "validAddressString",
  }
  return args
}

function getValidCreateMarketOrderValidateInput(): CreateOrderParameters {
  const args: CreateOrderParameters = {
    type: TradeType.Market,
    side: TradeSide.Buy,
    quantity: 1,
  }
  return args
}

function getValidcreateMarketOrderValidateApiResponse() {
  return { id: "validId" }
}

const falsyArgs = [null, undefined, NaN, 0, "", false]

describe("OkexExchangeConfiguration", () => {
  describe("constructor", () => {
    it("should return a OkexExchangeConfiguration", async () => {
      const configuration = new OkexExchangeConfiguration()
      expect(configuration).toBeInstanceOf(OkexExchangeConfiguration)
    })

    it("should use Okex exchange id", async () => {
      const configuration = new OkexExchangeConfiguration()
      expect(configuration.exchangeId).toBe(SupportedExchange.OKEX5)
    })

    it("should use Okex perpetual swap", async () => {
      const configuration = new OkexExchangeConfiguration()
      expect(configuration.instrumentId).toBe(SupportedInstrument.OKEX_PERPETUAL_SWAP)
    })
  })

  describe("fetchDepositAddressValidateInput", () => {
    it("should do nothing when currency is BTC", async () => {
      const configuration = new OkexExchangeConfiguration()
      const result = configuration.fetchDepositAddressValidateInput(TradeCurrency.BTC)
      expect(result).toBeUndefined()
    })

    it("should throw when currency is not BTC", async () => {
      const configuration = new OkexExchangeConfiguration()

      expect(() =>
        configuration.fetchDepositAddressValidateInput(TradeCurrency.USD),
      ).toThrowError(ApiError.UNSUPPORTED_CURRENCY)
    })
  })

  describe("fetchDepositAddressProcessApiResponse", () => {
    const API_ERROR_CANNOT_DESTRUCTURE = "Cannot destructure"

    it("should throw when response is falsy", async () => {
      const configuration = new OkexExchangeConfiguration()
      falsyArgs.forEach((response) => {
        expect(() =>
          configuration.fetchDepositAddressProcessApiResponse(response),
        ).toThrowError(ApiError.UNSUPPORTED_API_RESPONSE)
      })
    })

    it("should throw when response has no data property", async () => {
      const configuration = new OkexExchangeConfiguration()
      const response = {}
      expect(() =>
        configuration.fetchDepositAddressProcessApiResponse(response),
      ).toThrowError(ApiError.UNSUPPORTED_API_RESPONSE)
    })

    it("should throw when response has no data[].ccy property", async () => {
      const configuration = new OkexExchangeConfiguration()
      const response = {
        data: [
          {
            chain: "BTC-Bitcoin",
            // ccy: "BTC",
            addr: "anything",
          },
        ],
      }
      expect(() =>
        configuration.fetchDepositAddressProcessApiResponse(response),
      ).toThrowError(ApiError.UNSUPPORTED_CURRENCY)
    })

    it("should throw when response has no data[].addr property", async () => {
      const configuration = new OkexExchangeConfiguration()
      const response = {
        data: [
          {
            chain: "BTC-Bitcoin",
            ccy: "BTC",
            // addr: "anything",
          },
        ],
      }
      expect(() =>
        configuration.fetchDepositAddressProcessApiResponse(response),
      ).toThrowError(ApiError.UNSUPPORTED_ADDRESS)
    })

    it("should throw when response has no data[].chain property", async () => {
      const configuration = new OkexExchangeConfiguration()
      const response = {
        data: [
          {
            // chain: "BTC-Bitcoin",
            ccy: "BTC",
            addr: "anything",
          },
        ],
      }
      expect(() =>
        configuration.fetchDepositAddressProcessApiResponse(response),
      ).toThrowError(API_ERROR_CANNOT_DESTRUCTURE) // TODO figure out the exception
    })

    it(`should throw when response has no ${SupportedChain.BTC_Bitcoin} data[].chain property`, async () => {
      const configuration = new OkexExchangeConfiguration()
      const response = {
        data: [
          {
            chain: "wrong",
            ccy: "BTC",
            addr: "anything",
          },
        ],
      }
      expect(() =>
        configuration.fetchDepositAddressProcessApiResponse(response),
      ).toThrowError(API_ERROR_CANNOT_DESTRUCTURE)
      // the de-structure fails due to it relying on the chain prop
      // ).toThrowError(ApiError.UNSUPPORTED_CURRENCY)
    })

    it(`should throw when response has no ${TradeCurrency.BTC} data[].ccy property`, async () => {
      const configuration = new OkexExchangeConfiguration()
      const response = {
        data: [
          {
            chain: "BTC-Bitcoin",
            ccy: "wrong",
            addr: "anything",
          },
        ],
      }
      expect(() =>
        configuration.fetchDepositAddressProcessApiResponse(response),
      ).toThrowError(ApiError.UNSUPPORTED_CURRENCY)
    })

    it("should throw when response has no valid data[].addr property", async () => {
      const configuration = new OkexExchangeConfiguration()
      const response = {
        data: [
          {
            chain: "BTC-Bitcoin",
            ccy: "BTC",
            addr: "",
          },
        ],
      }
      expect(() =>
        configuration.fetchDepositAddressProcessApiResponse(response),
      ).toThrowError(ApiError.UNSUPPORTED_ADDRESS)
    })

    it("should return processed response", async () => {
      const configuration = new OkexExchangeConfiguration()
      const response = getValidFetchDepositAddressResponse()
      const expected = getProcessedFetchDepositAddressResponse()
      const result = configuration.fetchDepositAddressProcessApiResponse(response)
      expect(result).toEqual(expected)
    })
  })

  describe("withdrawValidateInput", () => {
    it(`should throw when response has no ${TradeCurrency.BTC} currency property`, async () => {
      const configuration = new OkexExchangeConfiguration()
      const args = getValidWithdrawValidateInput()
      args.currency = TradeCurrency.USD
      expect(() => configuration.withdrawValidateInput(args)).toThrowError(
        ApiError.UNSUPPORTED_CURRENCY,
      )
    })

    it("should throw when response has non positive quantity property", async () => {
      const configuration = new OkexExchangeConfiguration()
      const args = getValidWithdrawValidateInput()
      const invalidQuantity = [0, -1]
      for (const quantity of invalidQuantity) {
        args.quantity = quantity
        expect(() => configuration.withdrawValidateInput(args)).toThrowError(
          ApiError.NON_POSITIVE_QUANTITY,
        )
      }
    })

    it("should throw when response has no address property", async () => {
      const configuration = new OkexExchangeConfiguration()
      const args = getValidWithdrawValidateInput()
      args.address = ""
      expect(() => configuration.withdrawValidateInput(args)).toThrowError(
        ApiError.UNSUPPORTED_ADDRESS,
      )
    })

    it("should do nothing when arguments are all valid", async () => {
      const configuration = new OkexExchangeConfiguration()
      const args = getValidWithdrawValidateInput()
      const result = configuration.withdrawValidateInput(args)
      expect(result).toBeUndefined()
    })
  })

  describe("withdrawValidateApiResponse", () => {
    it("should throw when response is falsy", async () => {
      const configuration = new OkexExchangeConfiguration()
      falsyArgs.forEach((response) => {
        expect(() => configuration.withdrawValidateApiResponse(response)).toThrowError()
      })
    })

    it("should do nothing when response is valid", async () => {
      const configuration = new OkexExchangeConfiguration()
      const response = {}
      const result = configuration.withdrawValidateApiResponse(response)
      expect(result).toBeUndefined()
    })
  })

  describe("createMarketOrderValidateInput", () => {
    it("should throw when arguments is not a supported side property", async () => {
      const configuration = new OkexExchangeConfiguration()
      const args = getValidCreateMarketOrderValidateInput()
      //   const supportedTradeSide = [TradeSide.Buy, TradeSide.Sell]
      for (const tradeSide in TradeSide) {
        if (tradeSide !== TradeSide.Buy && tradeSide !== TradeSide.Sell) {
          args.side = tradeSide as TradeSide
          expect(() => configuration.createMarketOrderValidateInput(args)).toThrowError(
            ApiError.INVALID_TRADE_SIDE,
          )
        }
      }
    })

    it("should throw when arguments has non positive quantity property", async () => {
      const configuration = new OkexExchangeConfiguration()
      const args = getValidCreateMarketOrderValidateInput()
      const invalidQuantity = [0, -1]
      for (const quantity of invalidQuantity) {
        args.quantity = quantity
        expect(() => configuration.createMarketOrderValidateInput(args)).toThrowError(
          ApiError.NON_POSITIVE_QUANTITY,
        )
      }
    })
  })

  describe("createMarketOrderValidateApiResponse", () => {
    it("should throw when response is falsy", async () => {
      const configuration = new OkexExchangeConfiguration()
      falsyArgs.forEach((response) => {
        expect(() =>
          configuration.createMarketOrderValidateApiResponse(response),
        ).toThrowError(ApiError.UNSUPPORTED_API_RESPONSE)
      })
    })

    it("should throw when response has no id property", async () => {
      const configuration = new OkexExchangeConfiguration()
      const response = {}
      expect(() =>
        configuration.createMarketOrderValidateApiResponse(response),
      ).toThrowError(ApiError.MISSING_ORDER_ID)
    })

    it("should throw when response has missing value id property", async () => {
      const configuration = new OkexExchangeConfiguration()
      const response = getValidcreateMarketOrderValidateApiResponse()
      response.id = ""
      expect(() =>
        configuration.createMarketOrderValidateApiResponse(response),
      ).toThrowError(ApiError.MISSING_ORDER_ID)
    })

    it("should do nothing when response is valid", async () => {
      const configuration = new OkexExchangeConfiguration()
      const response = getValidcreateMarketOrderValidateApiResponse()
      const result = configuration.createMarketOrderValidateApiResponse(response)
      expect(result).toBeUndefined()
    })
  })

  describe("fetchOrderValidateInput", () => {
    it("should throw when id is falsy", async () => {
      const configuration = new OkexExchangeConfiguration()
      const id = ""
      expect(() => configuration.fetchOrderValidateInput(id)).toThrowError(
        ApiError.MISSING_PARAMETERS,
      )
    })

    it("should do nothing when id is truthy", async () => {
      const configuration = new OkexExchangeConfiguration()
      const id = "validId"
      const result = configuration.fetchOrderValidateInput(id)
      expect(result).toBeUndefined()
    })
  })

  describe("fetchOrderValidateApiResponse", () => {
    it("should throw when response is falsy", async () => {
      const configuration = new OkexExchangeConfiguration()
      falsyArgs.forEach((response) => {
        expect(() => configuration.fetchOrderValidateApiResponse(response)).toThrowError(
          ApiError.UNSUPPORTED_API_RESPONSE,
        )
      })
    })

    it("should throw when response has no status property", async () => {
      const configuration = new OkexExchangeConfiguration()
      const response = {}
      expect(() => configuration.fetchOrderValidateApiResponse(response)).toThrowError(
        ApiError.UNSUPPORTED_API_RESPONSE,
      )
    })

    it("should throw when response.status is not a supported OrderStatus property", async () => {
      const configuration = new OkexExchangeConfiguration()
      const response = { status: "" }
      expect(() => configuration.fetchOrderValidateApiResponse(response)).toThrowError(
        ApiError.UNSUPPORTED_API_RESPONSE,
      )
    })

    it("should do nothing when response is valid", async () => {
      const configuration = new OkexExchangeConfiguration()
      for (const status in OrderStatus) {
        const response = { status: status }
        const result = configuration.fetchOrderValidateApiResponse(response)
        expect(result).toBeUndefined()
      }
    })
  })
})
