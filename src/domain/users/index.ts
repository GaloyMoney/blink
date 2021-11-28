export const UserLanguage = {
  DEFAULT: "",
  EN_US: "en",
  ES_SV: "es",
} as const

import { InvalidPhoneNumber, InvalidUsername } from "@domain/errors"

export const UsernameRegex = /(?!^(1|3|bc1|lnbc1))^[0-9a-z_]{3,50}$/i

export const checkedToUsername = (username: string): Username | ValidationError => {
  if (!username.match(UsernameRegex)) {
    return new InvalidUsername(username)
  }
  return username as Username
}

export const PhoneNumberRegex = /^\+\d{7,14}$/i // FIXME {7,14} to be refined

export const checkedToPhoneNumber = (
  phoneNumber: string,
): PhoneNumber | ValidationError => {
  if (!phoneNumber.match(PhoneNumberRegex)) {
    return new InvalidPhoneNumber(phoneNumber)
  }
  return phoneNumber as PhoneNumber
}
