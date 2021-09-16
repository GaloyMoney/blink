import { AccountApiKeysRepository } from "@services/mongoose"

export const getApiKeysForAccount = async (
  accountId: AccountId,
): Promise<AccountApiKey[] | ApplicationError> => {
  const accountApiKeysRepository = AccountApiKeysRepository()
  const result = await accountApiKeysRepository.listByAccountId(accountId)
  if (result instanceof Error) return result
  return result
}
