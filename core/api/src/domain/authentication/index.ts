import { randomUUID } from "crypto"

import { EmailCodeInvalidError } from "./errors"

import { CacheKeys } from "@/domain/cache"
import { UuidRegex } from "@/domain/shared"
import { InvalidTelegramPassportNonceError } from "@/domain/errors"
import { ChannelType, PhoneCodeInvalidError } from "@/domain/phone-provider"

export const getSupportedCountries = ({
  allCountries,
  unsupportedSmsCountries,
  unsupportedWhatsAppCountries,
  unsupportedTelegramCountries,
}: {
  allCountries: CountryCode[]
  unsupportedSmsCountries: CountryCode[]
  unsupportedWhatsAppCountries: CountryCode[]
  unsupportedTelegramCountries: CountryCode[]
}): Country[] => {
  const countries: Country[] = []

  for (const country of allCountries) {
    const supportedAuthMethods: ChannelType[] = []

    if (!unsupportedTelegramCountries.includes(country)) {
      supportedAuthMethods.push(ChannelType.Telegram)
    }

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

export const createTelegramPassportNonce = (): TelegramPassportNonce => {
  return randomUUID() as TelegramPassportNonce
}

export const checkedToTelegramPassportNonce = (
  nonce: string,
): TelegramPassportNonce | ValidationError => {
  if (!nonce.match(UuidRegex)) {
    return new InvalidTelegramPassportNonceError(nonce)
  }
  return nonce as TelegramPassportNonce
}

export const telegramPassportRequestKey = (nonce: TelegramPassportNonce) =>
  `${CacheKeys.TelegramPassportNonce}:request:${nonce}`

export const telegramPassportLoginKey = (nonce: TelegramPassportNonce) =>
  `${CacheKeys.TelegramPassportNonce}:login:${nonce}`
