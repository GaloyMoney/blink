import { checkedToUsername } from "@domain/users"
import { AccountsRepository } from "@services/mongoose"

export const getUserByUsername = async function (username: string) {
  const usernameValid = checkedToUsername(username)
  if (usernameValid instanceof Error) throw usernameValid

  const username_ = username as Username

  const accounts = AccountsRepository()
  return accounts.findByUsername(username_)
}

export const getUserByPhone = async function (phone: string) {
  const accounts = AccountsRepository()
  return accounts.findByPhone(phone as PhoneNumber)
}
