import { AccountsRepository, WalletsRepository } from "@services/mongoose"

export * from "./account-limit"
export * from "./add-earn"
export * from "./add-new-contact"
export * from "./add-wallet"
export * from "./create-account"
export * from "./get-account-transactions-for-contact"
export * from "./get-contact-by-username"
export * from "./get-csv-for-account"
export * from "./get-transactions-for-account"
export * from "./send-default-wallet-balance-to-users"
export * from "./set-username"
export * from "./update-account-ip"
export * from "./update-account-level"
export * from "./update-account-status"
export * from "./update-business-map-info"
export * from "./update-contact-alias"
export * from "./update-default-walletid"
export * from "./update-display-currency"
export * from "./username-available"

const accounts = AccountsRepository()

export const getAccount = async (
  accountId: AccountId,
): Promise<Account | RepositoryError> => {
  return accounts.findById(accountId)
}

export const getAccountFromUserId = async (
  kratosUserId: UserId,
): Promise<Account | RepositoryError> => {
  return accounts.findByUserId(kratosUserId)
}

export const hasPermissions = async (
  accountId: AccountId,
  walletId: WalletId,
): Promise<boolean | ApplicationError> => {
  const wallet = await WalletsRepository().findById(walletId)
  if (wallet instanceof Error) return wallet

  return accountId === wallet.accountId
}

export const getBusinessMapMarkers = async () => {
  return accounts.listBusinessesForMap()
}

export const getUsernameFromWalletId = async (
  walletId: WalletId,
): Promise<Username | ApplicationError> => {
  const wallet = await WalletsRepository().findById(walletId)
  if (wallet instanceof Error) return wallet

  const account = await accounts.findById(wallet.accountId)
  if (account instanceof Error) return account
  return account.username
}
