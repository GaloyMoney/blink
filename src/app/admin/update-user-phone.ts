import { AuthWithPhonePasswordlessService } from "@services/kratos/auth-phone-no-password"
import { AccountsRepository } from "@services/mongoose/accounts"
import { UsersRepository } from "@services/mongoose/users"

export const updateUserPhone = async ({
  id,
  phone,
}: {
  id: string
  phone: PhoneNumber
}): Promise<Account | ApplicationError> => {
  const accountsRepo = AccountsRepository()
  const account = await accountsRepo.findById(id as AccountId)
  if (account instanceof Error) return account
  const kratosUserId = account.kratosUserId

  const usersRepo = UsersRepository()
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
