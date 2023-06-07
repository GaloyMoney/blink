import { IdentityRepository } from "@services/kratos"
import { AccountsRepository, UsersRepository } from "@services/mongoose"

export const markAccountForDeletion = async ({
  accountId,
}: {
  accountId: AccountId
}): Promise<true | ApplicationError> => {
  const accountsRepo = AccountsRepository()
  const account = await accountsRepo.findById(accountId)
  if (account instanceof Error) return account

  const { kratosUserId } = account

  const usersRepo = UsersRepository()
  const user = await usersRepo.findById(kratosUserId)
  if (user instanceof Error) return user

  const result = await usersRepo.adminUnsetPhoneForUserPreservation(kratosUserId)
  if (result instanceof Error) return result

  const identityRepo = IdentityRepository()
  const deletionResult = await identityRepo.deleteIdentity(kratosUserId)
  if (deletionResult instanceof Error) return deletionResult

  return true
}
