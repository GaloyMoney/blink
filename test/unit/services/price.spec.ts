import * as realtimePrice from "@services/price/get-realtime-price"
import * as priceHistory from "@services/price/get-price-history"
import { PriceService } from "@services/price"
import { CacheKeys, localCache } from "@services/price/local-cache"
import {
  PriceHistoryNotAvailableError,
  PriceInterval,
  PriceNotAvailableError,
  PriceRange,
  UnknownPriceServiceError,
} from "@domain/price"
import { generateSatoshiPriceHistory } from "test/helpers/price"

beforeEach(() => {
  localCache.del(CacheKeys.CurrentPrice)
  localCache.del(CacheKeys.PriceHistory(PriceRange.OneDay, PriceInterval.OneHour))
})

describe("Price", () => {
  describe("getCurrentPrice", () => {
    it("returns cached price when realtime fails", async () => {
      jest
        .spyOn(realtimePrice, "getRealTimePrice")
        .mockImplementationOnce(() => Promise.resolve(50000))
        .mockImplementationOnce(() => Promise.resolve(0))

      let price = await PriceService().getCurrentPrice()
      expect(price).toEqual(0.0005)

      price = await PriceService().getCurrentPrice()
      expect(price).toEqual(0.0005)
    })

    it("fails when realtime fails and cache is empty", async () => {
      jest
        .spyOn(realtimePrice, "getRealTimePrice")
        .mockImplementationOnce(() => Promise.resolve(0))

      const price = await PriceService().getCurrentPrice()
      expect(price).toBeInstanceOf(PriceNotAvailableError)
    })
  })

  describe("getPriceHistory", () => {
    it(`returns cached history prices`, async () => {
      const range = PriceRange.OneDay
      const interval = PriceInterval.OneHour

      jest.spyOn(priceHistory, "getPriceHistory").mockImplementationOnce(() =>
        Promise.resolve(
          generateSatoshiPriceHistory(1, 50000)
            .map((p) => ({ date: new Date(p.date), price: p.price as UsdPerSat }))
            .slice(-24),
        ),
      )

      const prices = await PriceService().listHistory(range, interval)
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

      const cachedPrices = await PriceService().listHistory(range, interval)
      expect(cachedPrices).toEqual(prices)
    })

    it("fails when cache is empty and db fails", async () => {
      const range = PriceRange.OneDay
      const interval = PriceInterval.OneHour

      jest
        .spyOn(priceHistory, "getPriceHistory")
        .mockImplementationOnce(() => Promise.resolve(new UnknownPriceServiceError()))

      const prices = await PriceService().listHistory(range, interval)
      expect(prices).toBeInstanceOf(UnknownPriceServiceError)
    })

    it("fails when cache and db history are empty", async () => {
      const range = PriceRange.OneDay
      const interval = PriceInterval.OneHour

      jest
        .spyOn(priceHistory, "getPriceHistory")
        .mockImplementationOnce(() => Promise.resolve([]))

      const prices = await PriceService().listHistory(range, interval)
      expect(prices).toBeInstanceOf(PriceHistoryNotAvailableError)
    })
  })
})
