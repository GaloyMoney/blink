import {
  PriceHistoryNotAvailableError,
  PriceInterval,
  PriceRange,
  UnknownPriceServiceError,
} from "@/domain/price"
import { CacheKeys } from "@/domain/cache"
import * as PriceServiceImpl from "@/services/price"
import { LocalCacheService } from "@/services/cache/local-cache"

import { getPriceHistory } from "@/app/prices"

import { generateSatoshiPriceHistory } from "test/helpers/price"

beforeEach(async () => {
  await LocalCacheService().clear({
    key: `${CacheKeys.PriceHistory}:${PriceRange.OneDay}-${PriceInterval.OneHour}`,
  })
})

jest.mock("@/services/tracing", () => ({
  /* eslint @typescript-eslint/ban-ts-comment: "off" */
  // @ts-ignore-next-line no-implicit-any error
  wrapAsyncFunctionsToRunInSpan: ({ fns }) => fns,
}))

afterAll(() => {
  jest.resetAllMocks()
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
        getSatRealTimePrice: jest.fn(),
        getUsdCentRealTimePrice: jest.fn(),
        listCurrencies: jest.fn(),
      }))

      const prices = await getPriceHistory({ range, interval })
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

      const cachedPrices = await getPriceHistory({ range, interval })
      expect(cachedPrices).toEqual(prices)
    })

    it("fails when cache is empty and db fails", async () => {
      const range = PriceRange.OneDay
      const interval = PriceInterval.OneHour

      jest.spyOn(PriceServiceImpl, "PriceService").mockImplementationOnce(() => ({
        listHistory: () => Promise.resolve(new UnknownPriceServiceError()),
        getSatRealTimePrice: jest.fn(),
        getUsdCentRealTimePrice: jest.fn(),
        listCurrencies: jest.fn(),
      }))

      const prices = await getPriceHistory({ range, interval })
      expect(prices).toBeInstanceOf(UnknownPriceServiceError)
    })

    it("fails when cache and db history are empty", async () => {
      const range = PriceRange.OneDay
      const interval = PriceInterval.OneHour

      jest.spyOn(PriceServiceImpl, "PriceService").mockImplementationOnce(() => ({
        listHistory: () => Promise.resolve([]),
        getSatRealTimePrice: jest.fn(),
        getUsdCentRealTimePrice: jest.fn(),
        listCurrencies: jest.fn(),
      }))

      const prices = await getPriceHistory({ range, interval })
      expect(prices).toBeInstanceOf(PriceHistoryNotAvailableError)
    })
  })
})
