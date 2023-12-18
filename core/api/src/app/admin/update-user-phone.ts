import { markAccountForDeletion } from "@/app/accounts"

import { AccountValidator, checkedToAccountId } from "@/domain/accounts"

import { UsersRepository } from "@/services/mongoose/users"
import { addAttributesToCurrentSpan } from "@/services/tracing"
import { AccountsRepository } from "@/services/mongoose/accounts"
import { AuthWithPhonePasswordlessService } from "@/services/kratos"

export const updateUserPhone = async ({
  accountId: accountIdRaw,
  phone,
  updatedByPrivilegedClientId,
}: {
  accountId: string
  phone: PhoneNumber
  updatedByPrivilegedClientId: PrivilegedClientId
}): Promise<Account | ApplicationError> => {
  const accountId = checkedToAccountId(accountIdRaw)
  if (accountId instanceof Error) return accountId

  const accountsRepo = AccountsRepository()
  const account = await accountsRepo.findById(accountId)
  if (account instanceof Error) return account
  const accountValidator = AccountValidator(account)
  if (accountValidator instanceof Error) return accountValidator
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
      updatedByPrivilegedClientId,
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
