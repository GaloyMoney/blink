import { checkedToUsername } from "@domain/accounts"
import { AccountsRepository, UsersRepository } from "@services/mongoose"
import { AuthWithPhonePasswordlessService, IdentityRepository } from "@services/kratos"

export const getAccountByUsername = async (username: string) => {
  const usernameValid = checkedToUsername(username)
  if (usernameValid instanceof Error) return usernameValid

  const accounts = AccountsRepository()
  return accounts.findByUsername(usernameValid)
}

export const getAccountByUserPhone = async (phone: PhoneNumber) => {
  const user = await UsersRepository().findByPhone(phone)
  if (user instanceof Error) return user

  const accounts = AccountsRepository()
  return accounts.findByUserId(user.id)
}

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

  const authService = AuthWithPhonePasswordlessService()
  const kratosResult = await authService.updatePhone({ kratosUserId, phone })

  if (kratosResult instanceof Error) return kratosResult

  const identityRepo = IdentityRepository()
  const identity = await identityRepo.getIdentity(kratosUserId)
  if (identity instanceof Error) return identity

  const oldPhone = identity.phone

  const usersRepo = UsersRepository()
  const user = await usersRepo.findByPhone(oldPhone)
  if (user instanceof Error) return user

  user.phone = phone
  await usersRepo.update(user)

  return account
}
