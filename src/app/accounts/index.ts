import { hashApiKey } from "@domain/accounts"
import { AccountApiKeysRepository, AccountsRepository } from "@services/mongoose"

export * from "./add-api-key-for-account"
export * from "./disable-api-key-for-account"
export * from "./get-api-keys-for-account"
export * from "./get-account-transactions-for-contact"

const accounts = AccountsRepository()

export const getAccount = async (accountId: AccountId) => {
  return accounts.findById(accountId)
}

export const getAccountByApiKey = async (
  key: string,
  secret: string,
): Promise<Account | ApplicationError> => {
  const hashedKey = await hashApiKey({ key, secret })
  if (hashedKey instanceof Error) return hashedKey

  const accountApiKeysRepository = AccountApiKeysRepository()
  const accountApiKey = await accountApiKeysRepository.findByHashedKey(hashedKey)
  if (accountApiKey instanceof Error) return accountApiKey

  return accounts.findById(accountApiKey.accountId)
}

export const hasPermissions = async (
  userId: UserId,
  walletId: WalletId,
): Promise<boolean | ApplicationError> => {
  const userAccounts = await accounts.listByUserId(userId)
  if (userAccounts instanceof Error) return userAccounts

  const walletAccount = await accounts.findByWalletId(walletId)
  if (walletAccount instanceof Error) return walletAccount

  return userAccounts.some((a) => a.id === walletAccount.id)
}

export const getBusinessMapMarkers = async () => {
  return accounts.listBusinessesForMap()
}

export const getUsernameFromWalletId = async (
  walletId: WalletId,
): Promise<Username | ApplicationError> => {
  const account = await accounts.findByWalletId(walletId)
  if (account instanceof Error) return account
  return account.username
}
