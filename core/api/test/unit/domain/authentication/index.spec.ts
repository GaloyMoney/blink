import { getSupportedCountries } from "@/domain/authentication"

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
