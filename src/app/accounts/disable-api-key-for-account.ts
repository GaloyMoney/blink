import { AccountApiKeysRepository } from "@services/mongoose"

export const disableApiKey = async ({
  accountId,
  label,
}: DisableApiKeyArgs): Promise<void | ApplicationError> => {
  const accountApiKeysRepository = AccountApiKeysRepository()
  const result = await accountApiKeysRepository.disableByLabel(accountId, label)
  if (result instanceof Error) return result
}
