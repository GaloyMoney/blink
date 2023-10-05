import { markAccountForDeletion } from "@/app/accounts"
import { checkedToAccountUuid } from "@/domain/accounts"
import { AuthWithPhonePasswordlessService } from "@/services/kratos"
import { AccountsRepository } from "@/services/mongoose/accounts"
import { UsersRepository } from "@/services/mongoose/users"
import { addAttributesToCurrentSpan } from "@/services/tracing"

export const updateUserPhone = async ({
  accountUuid: accountUuidRaw,
  phone,
  updatedByUserId,
}: {
  accountUuid: string
  phone: PhoneNumber
  updatedByUserId: UserId
}): Promise<Account | ApplicationError> => {
  const accountUuid = checkedToAccountUuid(accountUuidRaw)
  if (accountUuid instanceof Error) return accountUuid

  const accountsRepo = AccountsRepository()
  const account = await accountsRepo.findByUuid(accountUuid)
  if (account instanceof Error) return account
  const kratosUserId = account.kratosUserId

  const usersRepo = UsersRepository()

  const newUser = await usersRepo.findByPhone(phone)
  if (!(newUser instanceof Error)) {
    // if newUser exists, then we need to delete it (only if balance is 0
    addAttributesToCurrentSpan({ existingUser: true })

    const newAccount = await accountsRepo.findByUserId(newUser.id)
    if (newAccount instanceof Error) return newAccount

    const result = await markAccountForDeletion({
      accountId: newAccount.id,
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
