import { SECS_PER_5_MINS } from "@/config"

import {
  checkedToTelegramPassportNonce,
  telegramPassportLoginKey,
  telegramPassportRequestKey,
} from "@/domain/authentication"
import { checkedToPhoneNumber } from "@/domain/users"
import { InvalidNoncePhoneTelegramPassportError } from "@/domain/authentication/errors"

import { RedisCacheService } from "@/services/cache"

const redisCache = RedisCacheService()

export const authorizeTelegramPassportNonce = async ({
  phone,
  nonce,
}: {
  phone: string
  nonce: string
}): Promise<true | ApplicationError> => {
  const checkedPhoneNumber = checkedToPhoneNumber(phone)
  if (checkedPhoneNumber instanceof Error) return checkedPhoneNumber

  const checkedNonce = checkedToTelegramPassportNonce(nonce)
  if (checkedNonce instanceof Error) return checkedNonce

  const requestKey = telegramPassportRequestKey(checkedNonce)
  const phoneNumberFromNonce = await redisCache.get<PhoneNumber>({ key: requestKey })
  if (phoneNumberFromNonce instanceof Error) return phoneNumberFromNonce

  if (phoneNumberFromNonce !== checkedPhoneNumber) {
    return new InvalidNoncePhoneTelegramPassportError(nonce)
  }

  const loginKey = telegramPassportLoginKey(checkedNonce)
  const result = await redisCache.set<PhoneNumber>({
    key: loginKey,
    value: checkedPhoneNumber,
    ttlSecs: SECS_PER_5_MINS,
  })
  if (result instanceof Error) return result

  // invalidate request key
  await redisCache.clear({ key: requestKey })

  return true
}
