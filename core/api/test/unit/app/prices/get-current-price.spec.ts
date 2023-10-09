import { CacheKeys } from "@/domain/cache"
import { UsdDisplayCurrency } from "@/domain/fiat"
import { PriceNotAvailableError } from "@/domain/price"

import * as PriceServiceImpl from "@/services/price"
import { LocalCacheService } from "@/services/cache/local-cache"
import { getCurrentSatPrice, getCurrentUsdCentPrice } from "@/app/prices"

jest.mock("@/services/tracing", () => ({
  /* eslint @typescript-eslint/ban-ts-comment: "off" */
  // @ts-ignore-next-line no-implicit-any error
  wrapAsyncFunctionsToRunInSpan: ({ fns }) => fns,
}))

const EUR = "EUR" as DisplayCurrency

beforeEach(async () => {
  await LocalCacheService().clear({ key: CacheKeys.CurrentSatPrice })
  await LocalCacheService().clear({ key: CacheKeys.CurrentUsdCentPrice })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe("Prices", () => {
  describe("getCurrentSatPrice", () => {
    it("returns cached price when realtime fails", async () => {
      jest
        .spyOn(PriceServiceImpl, "PriceService")
        .mockImplementationOnce(() => ({
          listHistory: jest.fn(),
          getUsdCentRealTimePrice: jest.fn(),
          getSatRealTimePrice: () =>
            Promise.resolve({
              timestamp: new Date(),
              price: 0.05,
              currency: UsdDisplayCurrency,
            }),
          listCurrencies: jest.fn(),
        }))
        .mockImplementationOnce(() => ({
          listHistory: jest.fn(),
          getUsdCentRealTimePrice: jest.fn(),
          getSatRealTimePrice: () => Promise.resolve(new PriceNotAvailableError()),
          listCurrencies: jest.fn(),
        }))

      let satPrice = await getCurrentSatPrice({ currency: UsdDisplayCurrency })
      if (satPrice instanceof Error) throw satPrice
      expect(satPrice.price).toEqual(0.05)

      satPrice = await getCurrentSatPrice({ currency: UsdDisplayCurrency })
      if (satPrice instanceof Error) throw satPrice
      expect(satPrice.price).toEqual(0.05)
    })

    it("fails when realtime fails and cache is empty", async () => {
      jest.spyOn(PriceServiceImpl, "PriceService").mockImplementationOnce(() => ({
        listHistory: jest.fn(),
        getUsdCentRealTimePrice: jest.fn(),
        getSatRealTimePrice: () => Promise.resolve(new PriceNotAvailableError()),
        listCurrencies: jest.fn(),
      }))

      const price = await getCurrentSatPrice({ currency: UsdDisplayCurrency })
      expect(price).toBeInstanceOf(PriceNotAvailableError)
    })
  })

  describe("getCurrentUsdCentPrice", () => {
    it("returns cached price when realtime fails", async () => {
      jest
        .spyOn(PriceServiceImpl, "PriceService")
        .mockImplementationOnce(() => ({
          listHistory: jest.fn(),
          getSatRealTimePrice: jest.fn(),
          getUsdCentRealTimePrice: () =>
            Promise.resolve({
              timestamp: new Date(),
              price: 0.93,
              currency: EUR,
            }),
          listCurrencies: jest.fn(),
        }))
        .mockImplementationOnce(() => ({
          listHistory: jest.fn(),
          getSatRealTimePrice: jest.fn(),
          getUsdCentRealTimePrice: () => Promise.resolve(new PriceNotAvailableError()),
          listCurrencies: jest.fn(),
        }))

      let satPrice = await getCurrentUsdCentPrice({ currency: EUR })
      if (satPrice instanceof Error) throw satPrice
      expect(satPrice.price).toEqual(0.93)

      satPrice = await getCurrentUsdCentPrice({ currency: EUR })
      if (satPrice instanceof Error) throw satPrice
      expect(satPrice.price).toEqual(0.93)
    })

    it("fails when realtime fails and cache is empty", async () => {
      jest.spyOn(PriceServiceImpl, "PriceService").mockImplementationOnce(() => ({
        listHistory: jest.fn(),
        getSatRealTimePrice: jest.fn(),
        getUsdCentRealTimePrice: () => Promise.resolve(new PriceNotAvailableError()),
        listCurrencies: jest.fn(),
      }))

      const price = await getCurrentUsdCentPrice({ currency: EUR })
      expect(price).toBeInstanceOf(PriceNotAvailableError)
    })
  })
})
