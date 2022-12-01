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

export const checkedToLanguage = (
  language: string,
): UserLanguageOrEmpty | ValidationError => {
  if (language === "DEFAULT" || language === "") return "" as UserLanguageOrEmpty
  if (Languages.includes(language)) return language as UserLanguageOrEmpty
  return new InvalidLanguageError()
}

export const checkedToDeviceToken = (token: string): DeviceToken | ValidationError => {
  // token from firebase have a length of 163
  const correctLength = 163
  if (token.length !== correctLength) {
    return new InvalidDeviceTokenError(
      `wrong length, expected ${correctLength}, got ${token.length}`,
    )
  }

  return token as DeviceToken
}

export { Languages }
