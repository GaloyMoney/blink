import {
  getSmsAuthUnsupportedCountries,
  getWhatsAppAuthUnsupportedCountries,
} from "@config"
import { getSupportedCountries as getSupportedCountriesDomain } from "@domain/authentication"
import { getCountries } from "libphonenumber-js"

export const getSupportedCountries = (): Country[] => {
  return getSupportedCountriesDomain({
    allCountries: getCountries() as CountryCode[],
    unsupportedSmsCountries: getSmsAuthUnsupportedCountries(),
    unsupportedWhatsAppCountries: getWhatsAppAuthUnsupportedCountries(),
  })
}
