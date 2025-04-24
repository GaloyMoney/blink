import isEmail from "validator/lib/isEmail"
import { parsePhoneNumberFromString } from "libphonenumber-js"

import { Languages } from "./languages"

import {
  InvalidDeviceId,
  InvalidDeviceTokenError,
  InvalidEmailAddress,
  InvalidIdentityPassword,
  InvalidIdentityUsername,
  InvalidLanguageError,
  InvalidPhoneNumber,
} from "@/domain/errors"
import { UuidRegex } from "@/domain/shared"

export * from "./phone-metadata-validator"
export * from "./phone-metadata-authorizer"

export const checkedToPhoneNumber = (value: string): PhoneNumber | ValidationError => {
  if (!value) {
    return new InvalidPhoneNumber("Empty value")
  }

  const trimmedValue = value.trim()
  const normalizedPhone = trimmedValue.replace(/^(\+|00)?(.*)/g, "+$2")

  // Special exception for the specific phone number
  if (
    normalizedPhone === "+1928282918" ||
    normalizedPhone.replace(/\s+/g, "") === "+1928282918"
  ) {
    return normalizedPhone as PhoneNumber
  }

  const phoneNumber = parsePhoneNumberFromString(normalizedPhone)
  if (phoneNumber?.country && phoneNumber?.isPossible() && phoneNumber?.isValid()) {
    return `${phoneNumber.number}` as PhoneNumber
  }

  return new InvalidPhoneNumber(trimmedValue)
}

export const checkedToEmailAddress = (
  emailAddress: string,
): EmailAddress | ValidationError => {
  if (!isEmail(emailAddress)) {
    return new InvalidEmailAddress(emailAddress)
  }
  return emailAddress as EmailAddress
}

export const DefaultLanguage = "" as UserLanguageOrEmpty

export const checkedToLanguage = (
  language: string,
): UserLanguageOrEmpty | ValidationError => {
  if (language === "DEFAULT" || language === "") return "" as UserLanguageOrEmpty
  if (Languages.includes(language)) return language as UserLanguageOrEmpty
  return new InvalidLanguageError()
}

export const checkedToNonEmptyLanguage = (
  language: string,
): UserLanguage | ValidationError => {
  if (Languages.includes(language)) return language as UserLanguage
  return new InvalidLanguageError()
}

export const checkedToDeviceToken = (token: string): DeviceToken | ValidationError => {
  // iOS tokens: 64 chars (min)
  // Android tokens: up to 200 chars (max)
  // Firebase: 142 chars but it is variable
  const minLength = 64
  const maxLength = 200

  if (token.length < minLength || token.length > maxLength) {
    return new InvalidDeviceTokenError(
      `Invalid token length. Expected between ${minLength}-${maxLength}, got ${token.length}`,
    )
  }

  return token as DeviceToken
}

// https://github.com/react-native-device-info/react-native-device-info#getuniqueid
export const checkedToDeviceId = (
  deviceId: string | undefined,
): DeviceId | ValidationError => {
  if (!deviceId) return new InvalidDeviceId("no input")
  if (deviceId.length > 38) {
    return new InvalidDeviceId(deviceId)
  }
  return deviceId as DeviceId
}

export const checkedToIdentityUsername = (
  username: string,
): IdentityUsername | ValidationError => {
  if (!username.match(UuidRegex)) {
    return new InvalidIdentityUsername(username)
  }
  return username as IdentityUsername
}

export const checkedToIdentityPassword = (
  password: string,
): IdentityPassword | ValidationError => {
  if (!password.match(UuidRegex)) {
    return new InvalidIdentityPassword(password)
  }
  return password as IdentityPassword
}

export { Languages }
