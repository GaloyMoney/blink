import {
  InvalidDeviceTokenError,
  InvalidEmailAddress,
  InvalidLanguageError,
  InvalidPhoneNumber,
} from "@domain/errors"

import { Languages } from "./languages"

// TODO: we could be using https://gitlab.com/catamphetamine/libphonenumber-js#readme
// for a more precise "regex"
const PhoneNumberRegex = /^\+\d{7,14}$/i // FIXME {7,14} to be refined

const EmailAddressRegex = /^[\w-.+]+@([\w-]+\.)+[\w-]{2,4}$/i

export const checkedToPhoneNumber = (
  phoneNumber: string,
): PhoneNumber | ValidationError => {
  if (!phoneNumber.match(PhoneNumberRegex)) {
    return new InvalidPhoneNumber(phoneNumber)
  }
  return phoneNumber as PhoneNumber
}

export const checkedToEmailAddress = (
  emailAddress: string,
): EmailAddress | ValidationError => {
  if (!emailAddress.match(EmailAddressRegex)) {
    return new InvalidEmailAddress(emailAddress)
  }
  return emailAddress as EmailAddress
}

export const checkedToLanguage = (language: string): UserLanguage | ValidationError => {
  // FIXME: "" is not in the Languages list and this can lead to error
  // (NB: have seen that in tests. need to reproduce)
  if (language === "DEFAULT" || language === "") return "" as UserLanguage
  if (Languages.includes(language)) return language as UserLanguage
  return new InvalidLanguageError()
}

export const checkedToDeviceToken = (token: string): DeviceToken | ValidationError => {
  // token from firebase have a length of 163
  if (token.length !== 163) {
    return new InvalidDeviceTokenError("wrong length, expected")
  }

  return token as DeviceToken
}

export { Languages }
