import {
  PriceHistoryNotAvailableError,
  PriceInterval,
  PriceRange,
  UnknownPriceServiceError,
} from "@domain/price"
import { CacheKeys } from "@domain/cache"
import { Prices } from "@app"
import * as PriceServiceImpl from "@services/price"
import { LocalCacheService } from "@services/cache"

import { generateSatoshiPriceHistory } from "test/helpers/price"

jest.mock("@services/redis", () => ({}))

jest.mock("@config", () => {
  const config = jest.requireActual("@config")
  const getLndParams = (): LndParams[] => []
  return { ...config, getLndParams }
})

beforeEach(() => {
  LocalCacheService().clear({
    key: `${CacheKeys.PriceHistory}:${PriceRange.OneDay}-${PriceInterval.OneHour}`,
  })
})

describe("Prices", () => {
  describe("getPriceHistory", () => {
    it(`returns cached history prices`, async () => {
      const range = PriceRange.OneDay
      const interval = PriceInterval.OneHour

      jest.spyOn(PriceServiceImpl, "PriceService").mockImplementationOnce(() => ({
        listHistory: () =>
          Promise.resolve(
            generateSatoshiPriceHistory(1, 50000)
              .map((p) => ({
                date: new Date(p.date),
                price: p.price as DisplayCurrencyPerSat,
              }))
              .slice(-24),
          ),
        getRealTimePrice: jest.fn(),
      }))

      const prices = await Prices.getPriceHistory({ range, interval })
      if (prices instanceof Error) throw prices

      expect(prices.length).toBe(24)

      expect(prices).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            date: expect.any(Date),
            price: expect.any(Number),
          }),
        ]),
      )

      const cachedPrices = await Prices.getPriceHistory({ range, interval })
      expect(cachedPrices).toEqual(prices)
    })

    it("fails when cache is empty and db fails", async () => {
      const range = PriceRange.OneDay
      const interval = PriceInterval.OneHour

      jest.spyOn(PriceServiceImpl, "PriceService").mockImplementationOnce(() => ({
        listHistory: () => Promise.resolve(new UnknownPriceServiceError()),
        getRealTimePrice: jest.fn(),
      }))

      const prices = await Prices.getPriceHistory({ range, interval })
      expect(prices).toBeInstanceOf(UnknownPriceServiceError)
    })

    it("fails when cache and db history are empty", async () => {
      const range = PriceRange.OneDay
      const interval = PriceInterval.OneHour

      jest.spyOn(PriceServiceImpl, "PriceService").mockImplementationOnce(() => ({
        listHistory: () => Promise.resolve([]),
        getRealTimePrice: jest.fn(),
      }))

      const prices = await Prices.getPriceHistory({ range, interval })
      expect(prices).toBeInstanceOf(PriceHistoryNotAvailableError)
    })
  })
})
