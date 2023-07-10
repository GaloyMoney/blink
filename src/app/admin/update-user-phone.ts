import { markAccountForDeletion } from "@app/accounts"
import { checkedToAccountId } from "@domain/accounts"
import { AuthWithPhonePasswordlessService } from "@services/kratos"
import { AccountsRepository } from "@services/mongoose/accounts"
import { UsersRepository } from "@services/mongoose/users"
import { addAttributesToCurrentSpan } from "@services/tracing"

export const updateUserPhone = async ({
  id,
  phone,
  updatedByUserId,
}: {
  id: string
  phone: PhoneNumber
  updatedByUserId: UserId
}): Promise<Account | ApplicationError> => {
  const accountId = checkedToAccountId(id)
  if (accountId instanceof Error) return accountId

  const accountsRepo = AccountsRepository()
  const account = await accountsRepo.findById(accountId)
  if (account instanceof Error) return account
  const kratosUserId = account.kratosUserId

  const usersRepo = UsersRepository()

  const existingUser = await usersRepo.findByPhone(phone)
  if (!(existingUser instanceof Error)) {
    addAttributesToCurrentSpan({ existingUser: true })
    const result = await markAccountForDeletion({
      accountId,
      cancelIfPositiveBalance: true,
      updatedByUserId,
    })
    if (result instanceof Error) return result
  }

  const user = await usersRepo.findById(kratosUserId)
  if (user instanceof Error) return user

  user.phone = phone
  const result = await usersRepo.update(user)
  if (result instanceof Error) return result

  const authService = AuthWithPhonePasswordlessService()
  const kratosResult = await authService.updatePhone({ kratosUserId, phone })
  if (kratosResult instanceof Error) return kratosResult

  return account
}
