import { getCountries } from "libphonenumber-js"

import {
  getSmsAuthUnsupportedCountries,
  getWhatsAppAuthUnsupportedCountries,
  getTelegramAuthUnsupportedCountries,
} from "@/config"
import { getSupportedCountries as getSupportedCountriesDomain } from "@/domain/authentication"

export const getSupportedCountries = (): Country[] => {
  return getSupportedCountriesDomain({
    allCountries: getCountries() as CountryCode[],
    unsupportedSmsCountries: getSmsAuthUnsupportedCountries(),
    unsupportedWhatsAppCountries: getWhatsAppAuthUnsupportedCountries(),
    unsupportedTelegramCountries: getTelegramAuthUnsupportedCountries(),
  })
}
