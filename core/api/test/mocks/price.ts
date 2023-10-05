import { NotImplementedError } from "@/domain/errors"

export const PriceService = (): IPriceService => {
  return {
    getSatRealTimePrice: async () => new NotImplementedError(),
    getUsdCentRealTimePrice: async () => new NotImplementedError(),
    listHistory: async () => new NotImplementedError(),
    listCurrencies: async () => [
      {
        code: "EUR",
        symbol: "€",
        name: "Euro",
        flag: "🇪🇺",
        fractionDigits: 2,
      } as PriceCurrency,
      {
        code: "CRC",
        symbol: "₡",
        name: "Costa Rican Colón",
        flag: "🇨🇷",
        fractionDigits: 2,
      } as PriceCurrency,
      {
        code: "USD",
        symbol: "$",
        name: "US Dollar",
        flag: "🇺🇸",
        fractionDigits: 2,
      } as PriceCurrency,
    ],
  }
}
