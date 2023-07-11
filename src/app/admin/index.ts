export * from "./update-user-phone"

import { checkedToUsername } from "@domain/accounts"
import { getUserIdFromIdentifier } from "@services/kratos"
import { AccountsRepository } from "@services/mongoose"

export const getAccountByUsername = async (username: string) => {
  const usernameValid = checkedToUsername(username)
  if (usernameValid instanceof Error) return usernameValid

  const accounts = AccountsRepository()
  return accounts.findByUsername(usernameValid)
}

export const getAccountByUserPhone = async (phone: PhoneNumber) => {
  const userId = await getUserIdFromIdentifier(phone)
  if (userId instanceof Error) return userId

  const accounts = AccountsRepository()
  return accounts.findByUserId(userId)
}

export const getAccountByUserEmail = async (email: EmailAddress) => {
  const userId = await getUserIdFromIdentifier(email)
  if (userId instanceof Error) return userId

  const accounts = AccountsRepository()
  return accounts.findByUserId(userId)
}
