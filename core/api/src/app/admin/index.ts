export * from "./update-user-phone"
export * from "./trigger-marketing-notification"
export * from "./filtered-user-count"
import { checkedToAccountId, checkedToUserId, checkedToUsername } from "@/domain/accounts"
import { IdentityRepository } from "@/services/kratos"
import { AccountsRepository, UsersRepository } from "@/services/mongoose"

export const getAccountByUsername = async (username: string) => {
  const usernameValid = checkedToUsername(username)
  if (usernameValid instanceof Error) return usernameValid

  const accounts = AccountsRepository()
  return accounts.findByUsername(usernameValid)
}

export const getAccountByUserPhone = async (phone: PhoneNumber) => {
  // TODO: replace by getAccountByUserPhone
  // but need to change the integration admin query test first
  const user = await UsersRepository().findByPhone(phone)
  if (user instanceof Error) return user

  const accounts = AccountsRepository()
  return accounts.findByUserId(user.id)
}

export const getAccountByUserEmail = async (email: EmailAddress) => {
  const identities = IdentityRepository()
  const userId = await identities.getUserIdFromIdentifier(email)
  if (userId instanceof Error) return userId

  const accounts = AccountsRepository()
  return accounts.findByUserId(userId)
}

export const getAccountByAccountId = async (accountIdRaw: string) => {
  const accountId = checkedToAccountId(accountIdRaw)
  if (accountId instanceof Error) return accountId
  const accounts = AccountsRepository()
  return accounts.findById(accountId)
}

export const getAccountByUserId = async (userIdRaw: string) => {
  const userId = checkedToUserId(userIdRaw)
  if (userId instanceof Error) return userId
  const accounts = AccountsRepository()
  return accounts.findByUserId(userId)
}
