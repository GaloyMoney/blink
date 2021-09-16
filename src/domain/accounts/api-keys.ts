import util from "util"
import crypto, { BinaryLike } from "crypto"

import {
  ApiKeyError,
  ApiKeyHashError,
  InvalidApiKeyError,
  InvalidExpirationError,
} from "./errors"

const randomBytes = util.promisify(crypto.randomBytes)
const scrypt = util.promisify<BinaryLike, BinaryLike, number, Buffer>(crypto.scrypt)

const randomString = async (size: number, encoding: BufferEncoding): Promise<string> => {
  const rnd = await randomBytes(size)
  return rnd.toString(encoding)
}

const hasExpired = (expireAt: Date): boolean => {
  const now = new Date(Date.now())
  return expireAt < now
}

export const randomApiKey = async (expireAt: Date): Promise<ApiKey | ApiKeyError> => {
  if (hasExpired(expireAt)) return new InvalidExpirationError()

  return {
    key: await randomString(16, "hex"),
    secret: await randomString(32, "base64"),
    expireAt,
  }
}

export const hashApiKey = async ({
  key,
  secret,
  expireAt,
}: ApiKey): Promise<HashedKey | ApiKeyError> => {
  if (!key || !secret) return new InvalidApiKeyError()
  if (hasExpired(expireAt)) return new InvalidExpirationError()

  try {
    const hash = await scrypt(key, secret, 64)
    return hash.toString("base64") as HashedKey
  } catch {
    return new ApiKeyHashError()
  }
}
