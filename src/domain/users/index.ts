import { AccountLevel } from "@domain/accounts"
import {
  InvalidAccountLevelError,
  InvalidEmailAddress,
  InvalidKratosUserId,
  InvalidLanguageError,
  InvalidPhoneNumber,
} from "@domain/errors"

import { Languages } from "./languages"

// TODO: we could be using https://gitlab.com/catamphetamine/libphonenumber-js#readme
// for a more precise "regex"
const PhoneNumberRegex = /^\+\d{7,14}$/i // FIXME {7,14} to be refined

const KratosUserIdRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const EmailAddressRegex = /^[\w-.+]+@([\w-]+\.)+[\w-]{2,4}$/i

export const checkedToPhoneNumber = (
  phoneNumber: string,
): PhoneNumber | ValidationError => {
  if (!phoneNumber.match(PhoneNumberRegex)) {
    return new InvalidPhoneNumber(phoneNumber)
  }
  return phoneNumber as PhoneNumber
}

export const checkedToKratosUserId = (userId: string): KratosUserId | ValidationError => {
  if (!userId.match(KratosUserIdRegex)) {
    return new InvalidKratosUserId(userId)
  }
  return userId as KratosUserId
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
  if (language === "DEFAULT" || language === "") return "" as UserLanguage
  if (Languages.includes(language)) return language as UserLanguage
  return new InvalidLanguageError()
}

export const checkedToAccountLevel = (level: number): AccountLevel | ValidationError => {
  if (Object.values<number>(AccountLevel).includes(level)) return level as AccountLevel
  return new InvalidAccountLevelError()
}

export { Languages }
