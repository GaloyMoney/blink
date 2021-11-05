import { CacheKeys } from "@domain/cache"
import { getCurrentPrice } from "@app/prices"
import * as PriceServiceImpl from "@services/price"
import { LocalCacheService } from "@services/cache"
import { PriceNotAvailableError } from "@domain/price"

beforeEach(() => {
  LocalCacheService().clear(CacheKeys.CurrentPrice)
})

describe("Prices", () => {
  describe("getCurrentPrice", () => {
    it("returns cached price when realtime fails", async () => {
      jest
        .spyOn(PriceServiceImpl, "PriceService")
        .mockImplementationOnce(() => ({
          listHistory: jest.fn(),
          getRealTimePrice: () => Promise.resolve(0.0005 as UsdPerSat),
        }))
        .mockImplementationOnce(() => ({
          listHistory: jest.fn(),
          getRealTimePrice: () => Promise.resolve(new PriceNotAvailableError()),
        }))

      let price = await getCurrentPrice()
      expect(price).toEqual(0.0005)

      price = await getCurrentPrice()
      expect(price).toEqual(0.0005)
    })

    it("fails when realtime fails and cache is empty", async () => {
      jest.spyOn(PriceServiceImpl, "PriceService").mockImplementationOnce(() => ({
        listHistory: jest.fn(),
        getRealTimePrice: () => Promise.resolve(new PriceNotAvailableError()),
      }))

      const price = await getCurrentPrice()
      expect(price).toBeInstanceOf(PriceNotAvailableError)
    })
  })
})
