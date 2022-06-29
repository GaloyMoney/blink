import { checkedToUsername } from "@domain/accounts"
import { AccountsRepository, UsersRepository } from "@services/mongoose"

export const getAccountByUsername = async (username: string) => {
  const usernameValid = checkedToUsername(username)
  if (usernameValid instanceof Error) return usernameValid

  const accounts = AccountsRepository()
  return accounts.findByUsername(usernameValid)
}

export const getAccountByUserPhone = async (phone: PhoneNumber) => {
  const users = UsersRepository()
  const user = await users.findByPhone(phone)
  if (user instanceof Error) return user

  const accounts = AccountsRepository()
  return accounts.findById(user.defaultAccountId)
}
