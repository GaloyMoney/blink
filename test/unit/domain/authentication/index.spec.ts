import { getNextPage, getSupportedCountries } from "@domain/authentication"

describe("getSupportedCountries", () => {
  it("returns supported countries", () => {
    const countries = getSupportedCountries({
      allCountries: ["CA", "US", "SV"] as CountryCode[],
      unsupportedSmsCountries: ["CA", "SV"] as CountryCode[],
      unsupportedWhatsAppCountries: ["US", "SV"] as CountryCode[],
    })

    expect(countries).toEqual([
      {
        id: "CA",
        supportedAuthChannels: ["whatsapp"],
      },
      {
        id: "US",
        supportedAuthChannels: ["sms"],
      },
    ])
  })
})

describe("decoding link header", () => {
  const withNext =
    '<http://0.0.0.0:4434/identities?page=1&page_size=1&page_token=eyJvZmZzZXQiOiIxIiwidiI6Mn0&per_page=1>; rel="next",<http://0.0.0.0:4434/identities?page=1&page_size=1&page_token=eyJvZmZzZXQiOiIxIiwidiI6Mn0&per_page=1>; rel="last"'

  const withoutNext =
    '<http://0.0.0.0:4434/identities?page=0&page_size=1&page_token=eyJvZmZzZXQiOiIwIiwidiI6Mn0&per_page=1>; rel="first",<http://0.0.0.0:4434/identities?page=0&page_size=1&page_token=eyJvZmZzZXQiOiIwIiwidiI6Mn0&per_page=1>; rel="prev"'

  it("try decoding link successfully", () => {
    expect(getNextPage(withNext)).toBe(1)
  })

  it("should be undefined when no more next is present", () => {
    expect(getNextPage(withoutNext)).toBe(undefined)
  })
})
