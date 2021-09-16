import { hashApiKey, randomApiKey } from "@domain/accounts"
import { AccountApiKeysRepository } from "@services/mongoose"

export const generateApiKey = async ({
  accountId,
  label = "",
  expireAt,
}: GenerateApiKeyArgs): Promise<ApiKey | ApplicationError> => {
  const apiKey = await randomApiKey(expireAt)
  if (apiKey instanceof Error) return apiKey

  const hashedKey = await hashApiKey(apiKey)
  if (hashedKey instanceof Error) return hashedKey

  const accountApiKeysRepository = AccountApiKeysRepository()
  const apiKeyLabel = label.trim() || apiKey.key.substring(0, 6)
  const savedHash = await accountApiKeysRepository.persistNew(
    accountId,
    apiKeyLabel,
    hashedKey,
    apiKey.expireAt,
  )
  if (savedHash instanceof Error) return savedHash

  return apiKey
}
