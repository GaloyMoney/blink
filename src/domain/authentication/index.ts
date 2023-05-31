import { ChannelType } from "@domain/phone-provider"

export const getSupportedCountries = ({
  allCountries,
  unsupportedSmsCountries,
  unsupportedWhatsAppCountries,
}: {
  allCountries: CountryCode[]
  unsupportedSmsCountries: CountryCode[]
  unsupportedWhatsAppCountries: CountryCode[]
}): Country[] => {
  const countries: Country[] = []

  for (const country of allCountries) {
    const supportedAuthMethods: ChannelType[] = []

    if (!unsupportedSmsCountries.includes(country)) {
      supportedAuthMethods.push(ChannelType.Sms)
    }

    if (!unsupportedWhatsAppCountries.includes(country)) {
      supportedAuthMethods.push(ChannelType.Whatsapp)
    }

    if (supportedAuthMethods.length > 0) {
      countries.push({
        id: country,
        supportedAuthChannels: supportedAuthMethods,
      })
    }
  }

  return countries
}
