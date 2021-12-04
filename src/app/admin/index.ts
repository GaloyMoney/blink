import { checkedToPhoneNumber, checkedToUsername } from "@domain/users"
import { AccountsRepository, UsersRepository } from "@services/mongoose"

export const getAccountByUsername = async (username: string) => {
  const usernameValid = checkedToUsername(username)
  if (usernameValid instanceof Error) return usernameValid

  const accounts = AccountsRepository()
  return accounts.findByUsername(usernameValid)
}

export const getAccountByUserPhone = async (phone: string) => {
  const phoneNumberValid = checkedToPhoneNumber(phone)
  if (phoneNumberValid instanceof Error) return phoneNumberValid

  const users = UsersRepository()
  const user = await users.findByPhone(phoneNumberValid)
  if (user instanceof Error) return user

  const accounts = AccountsRepository()
  return accounts.findById(user.defaultAccountId)
}
