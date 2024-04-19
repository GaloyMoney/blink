import {
  CouldNotFindCurrencyFromCountryError,
  CouldNotFindPriceCurrencyError,
} from "./errors"

export const displayCurrencyFromCountryCode = ({
  countryCode,
  currencies,
}: {
  countryCode: string
  currencies: PriceCurrency[]
}): DisplayCurrency | CouldNotFindPriceCurrencyError => {
  for (const currency of currencies) {
    if (currency.countryCodes.includes(countryCode)) {
      return currency.code
    }
  }

  return new CouldNotFindCurrencyFromCountryError(countryCode)
}
