import { PriceService } from "@/services/price"

export const displayCurrencyFromCountryCode = async (
  countryCode: string,
): Promise<DisplayCurrency | false | ApplicationError> => {
  const currencies = await PriceService().listCurrencies()
  if (currencies instanceof Error) return currencies

  for (const currency of currencies) {
    if (currency.countryCodes.includes(countryCode)) {
      return currency.code
    }
  }
  return false
}
