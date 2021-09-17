import { hashApiKey, randomApiKey } from "@domain/accounts"
import { AccountApiKeysRepository } from "@services/mongoose"

export const addApiKeyForAccount = async ({
  accountId,
  label = "",
  expireAt,
}: AddApiKeyForAccountArgs): Promise<ApiKey | ApplicationError> => {
  const apiKey = await randomApiKey(expireAt, label)
  if (apiKey instanceof Error) return apiKey

  const hashedKey = await hashApiKey(apiKey)
  if (hashedKey instanceof Error) return hashedKey

  const accountApiKeysRepository = AccountApiKeysRepository()
  const savedHash = await accountApiKeysRepository.persistNew(
    accountId,
    apiKey.label,
    hashedKey,
    apiKey.expireAt,
  )
  if (savedHash instanceof Error) return savedHash

  return apiKey
}
