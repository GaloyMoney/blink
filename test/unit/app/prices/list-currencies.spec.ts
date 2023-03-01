import { CacheKeys } from "@domain/cache"
import { Prices } from "@app"
import * as PriceServiceImpl from "@services/price"
import { LocalCacheService } from "@services/cache"
import { PriceCurrenciesNotAvailableError } from "@domain/price"

jest.mock("@services/redis", () => ({}))

jest.mock("@config", () => {
  const config = jest.requireActual("@config")
  const getLndParams = (): LndParams[] => []
  return { ...config, getLndParams }
})

beforeEach(() => {
  LocalCacheService().clear({ key: CacheKeys.PriceCurrencies })
})

describe("Prices", () => {
  describe("listCurrencies", () => {
    it("returns cached currencies", async () => {
      jest
        .spyOn(PriceServiceImpl, "PriceService")
        .mockImplementationOnce(() => ({
          listHistory: jest.fn(),
          getSatRealTimePrice: jest.fn(),
          getUsdCentRealTimePrice: jest.fn(),
          listCurrencies: () =>
            Promise.resolve([
              {
                code: "USD",
                symbol: "$",
                name: "US Dollar",
                flag: "🇺🇸",
                fractionDigits: 2,
              },
            ]),
        }))
        .mockImplementationOnce(() => ({
          listHistory: jest.fn(),
          getSatRealTimePrice: jest.fn(),
          getUsdCentRealTimePrice: jest.fn(),
          listCurrencies: () => Promise.resolve(new PriceCurrenciesNotAvailableError()),
        }))

      const currencies = await Prices.listCurrencies()
      expect(currencies).not.toBeInstanceOf(Error)

      if (currencies instanceof Error) throw currencies
      expect(currencies.length).toEqual(1)
      expect(currencies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: expect.any(String),
            symbol: expect.any(String),
            name: expect.any(String),
            flag: expect.any(String),
            fractionDigits: expect.any(Number),
          }),
        ]),
      )

      const cachedCurrencies = await Prices.listCurrencies()
      expect(cachedCurrencies).toEqual(currencies)
    })

    it("fails when listCurrencies fails and cache is empty", async () => {
      jest.spyOn(PriceServiceImpl, "PriceService").mockImplementationOnce(() => ({
        listHistory: jest.fn(),
        getSatRealTimePrice: jest.fn(),
        getUsdCentRealTimePrice: jest.fn(),
        listCurrencies: () => Promise.resolve(new PriceCurrenciesNotAvailableError()),
      }))

      const currencies = await Prices.listCurrencies()
      expect(currencies).toBeInstanceOf(PriceCurrenciesNotAvailableError)
    })
  })
})
