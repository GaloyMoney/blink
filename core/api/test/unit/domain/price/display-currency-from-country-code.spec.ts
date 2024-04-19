import {
  CouldNotFindCurrencyFromCountryError,
  displayCurrencyFromCountryCode,
} from "@/domain/price"

const currencies: PriceCurrency[] = [
  {
    code: "USD" as DisplayCurrency,
    symbol: "$",
    name: "US Dollar",
    flag: "🇺🇸",
    fractionDigits: 2,
    countryCodes: ["US"],
  },
]

describe("displayCurrencyFromCountryCode", () => {
  it("returns currency for a valid country code", () => {
    const displayCurrency = displayCurrencyFromCountryCode({
      countryCode: "US",
      currencies,
    })
    expect(displayCurrency).toEqual("USD")
  })

  it("returns error for a invalid country code", () => {
    const displayCurrency = displayCurrencyFromCountryCode({
      countryCode: "NotACountry",
      currencies,
    })
    expect(displayCurrency).toBeInstanceOf(CouldNotFindCurrencyFromCountryError)
  })
})
