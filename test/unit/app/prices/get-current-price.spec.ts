import { Prices } from "@app"

import { CacheKeys } from "@domain/cache"
import { DisplayCurrency } from "@domain/fiat"
import { PriceNotAvailableError } from "@domain/price"

import * as PriceServiceImpl from "@services/price"
import { LocalCacheService } from "@services/cache"

jest.mock("@services/redis", () => ({}))

jest.mock("@config", () => {
  const config = jest.requireActual("@config")
  const getLndParams = (): LndParams[] => []
  return { ...config, getLndParams }
})

beforeEach(() => {
  LocalCacheService().clear({ key: CacheKeys.CurrentPrice })
})

describe("Prices", () => {
  describe("getCurrentPrice", () => {
    it("returns cached price when realtime fails", async () => {
      jest
        .spyOn(PriceServiceImpl, "PriceService")
        .mockImplementationOnce(() => ({
          listHistory: jest.fn(),
          getRealTimePrice: () => Promise.resolve(0.05 as DisplayCurrencyPerSat),
          listCurrencies: jest.fn(),
        }))
        .mockImplementationOnce(() => ({
          listHistory: jest.fn(),
          getRealTimePrice: () => Promise.resolve(new PriceNotAvailableError()),
          listCurrencies: jest.fn(),
        }))

      let price = await Prices.getCurrentPrice({ currency: DisplayCurrency.Usd })
      expect(price).toEqual(0.05)

      price = await Prices.getCurrentPrice({ currency: DisplayCurrency.Usd })
      expect(price).toEqual(0.05)
    })

    it("fails when realtime fails and cache is empty", async () => {
      jest.spyOn(PriceServiceImpl, "PriceService").mockImplementationOnce(() => ({
        listHistory: jest.fn(),
        getRealTimePrice: () => Promise.resolve(new PriceNotAvailableError()),
        listCurrencies: jest.fn(),
      }))

      const price = await Prices.getCurrentPrice({ currency: DisplayCurrency.Usd })
      expect(price).toBeInstanceOf(PriceNotAvailableError)
    })
  })
})
