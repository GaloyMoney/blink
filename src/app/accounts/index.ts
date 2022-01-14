import { hashApiKey } from "@domain/accounts"
import {
  AccountApiKeysRepository,
  AccountsRepository,
  WalletsRepository,
} from "@services/mongoose"

export * from "./add-api-key-for-account"
export * from "./disable-api-key-for-account"
export * from "./get-account-transactions-for-contact"
export * from "./get-api-keys-for-account"
export * from "./update-account-level"
export * from "./update-account-status"
export * from "./update-business-map-info"
export * from "./send-default-wallet-balance-to-users"
export * from "./add-earn"
export * from "./set-username"
export * from "./username-available"
export * from "./get-contact-by-username"
export * from "./update-contact-alias"
export * from "./add-new-contact"
export * from "./add-wallet"
export * from "./set-default-walletid"

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
  const userAccount = await accounts.findByUserId(userId)
  if (userAccount instanceof Error) return userAccount

  const accountIdFromWallet = await WalletsRepository().getAccountId(walletId)
  if (accountIdFromWallet instanceof Error) return accountIdFromWallet

  // FIXME: why is the String() wrapper necessary?
  // console.log(accountIdFromWallet) shows: 61e17bad0159c6372bf57be5 without "" around id
  // userAccount.id has "" around it
  return String(userAccount.id) === String(accountIdFromWallet)
}

export const getBusinessMapMarkers = async () => {
  return accounts.listBusinessesForMap()
}

export const getUsernameFromWalletId = async (
  walletId: WalletId,
): Promise<Username | ApplicationError> => {
  const accountId = await WalletsRepository().getAccountId(walletId)
  if (accountId instanceof Error) return accountId

  const account = await accounts.findById(accountId)
  if (account instanceof Error) return account
  return account.username
}
