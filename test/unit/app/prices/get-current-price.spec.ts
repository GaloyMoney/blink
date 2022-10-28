import { CacheKeys } from "@domain/cache"
import { Prices } from "@app"
import * as PriceServiceImpl from "@services/price"
import { LocalCacheService } from "@services/cache"
import { PriceNotAvailableError } from "@domain/price"

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
        }))
        .mockImplementationOnce(() => ({
          listHistory: jest.fn(),
          getRealTimePrice: () => Promise.resolve(new PriceNotAvailableError()),
        }))

      let price = await Prices.getCurrentPrice()
      expect(price).toEqual(0.05)

      price = await Prices.getCurrentPrice()
      expect(price).toEqual(0.05)
    })

    it("fails when realtime fails and cache is empty", async () => {
      jest.spyOn(PriceServiceImpl, "PriceService").mockImplementationOnce(() => ({
        listHistory: jest.fn(),
        getRealTimePrice: () => Promise.resolve(new PriceNotAvailableError()),
      }))

      const price = await Prices.getCurrentPrice()
      expect(price).toBeInstanceOf(PriceNotAvailableError)
    })
  })
})
