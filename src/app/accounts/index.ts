import { AccountsRepository } from "@services/mongoose"

export const getAccount = async (accountId: AccountId) => {
  const accounts = AccountsRepository()
  return accounts.findById(accountId)
}

export const hasPermissions = async (
  userId: UserId,
  walletName: WalletName,
): Promise<boolean | ApplicationError> => {
  const accounts = AccountsRepository()

  const userAccounts = await accounts.listByUserId(userId)
  if (userAccounts instanceof Error) return userAccounts

  const walletAccount = await accounts.findByWalletName(walletName)
  if (walletAccount instanceof Error) return walletAccount

  return userAccounts.some((a) => a.id === walletAccount.id)
}

export const getBusinessMapMarkers = async () => {
  const accounts = AccountsRepository()
  return accounts.listBusinessesForMap()
}
