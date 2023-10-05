export * from "./update-user-phone"
export * from "./send-admin-push-notification"

import { checkedToAccountUuid, checkedToUsername } from "@/domain/accounts"
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

export const getAccountByAccountUuid = async (accountUuid: AccountUuid) => {
  const accountUuidValid = checkedToAccountUuid(accountUuid)
  if (accountUuidValid instanceof Error) return accountUuidValid

  const accounts = AccountsRepository()
  return accounts.findByUuid(accountUuidValid)
}
