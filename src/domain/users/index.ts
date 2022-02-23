export const UserLanguage = {
  DEFAULT: "",
  EN_US: "en",
  ES_SV: "es",
} as const

import { AccountLevel } from "@domain/accounts"
import {
  InvalidAccountLevelError,
  InvalidLanguageError,
  InvalidPhoneNumber,
} from "@domain/errors"

// TODO: we could be using https://gitlab.com/catamphetamine/libphonenumber-js#readme
// for a more precise "regex"
const PhoneNumberRegex = /^\+\d{7,14}$/i // FIXME {7,14} to be refined

export const checkedToPhoneNumber = (
  phoneNumber: string,
): PhoneNumber | ValidationError => {
  if (!phoneNumber.match(PhoneNumberRegex)) {
    return new InvalidPhoneNumber(phoneNumber)
  }
  return phoneNumber as PhoneNumber
}

export const checkedToLanguage = (language: string): UserLanguage | ValidationError => {
  if (Object.values<string>(UserLanguage).includes(language))
    return language as UserLanguage
  return new InvalidLanguageError()
}

export const checkedToAccountLevel = (level: number): AccountLevel | ValidationError => {
  if (Object.values<number>(AccountLevel).includes(level)) return level as AccountLevel
  return new InvalidAccountLevelError()
}
