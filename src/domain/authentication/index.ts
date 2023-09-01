import { ChannelType, PhoneCodeInvalidError } from "@domain/phone-provider"

import { EmailCodeInvalidError } from "./errors"

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

export const getNextPage = (link: string): number | undefined => {
  const links = link.split(",")
  const next = links.find((l) => l.includes('rel="next"'))
  if (!next) return undefined

  const nextSplit = next.split("page=")
  const splittingOnNumber = nextSplit[1].match(/^\d+&/)
  if (splittingOnNumber === null) return undefined

  const page = +splittingOnNumber[0].slice(0, -1)
  return page
}

export const checkedToEmailCode = (code: string): EmailCode | ApplicationError => {
  if (!/^[0-9]{6}$/.test(code)) return new EmailCodeInvalidError()
  return code as EmailCode
}

export const validOneTimeAuthCodeValue = (code: string) => {
  if (code.match(/^[0-9]{6}/i)) {
    return code as PhoneCode
  }
  return new PhoneCodeInvalidError({ message: "Invalid value for OneTimeAuthCode" })
}
