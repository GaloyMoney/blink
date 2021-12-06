import { hashApiKey } from "@domain/accounts"
import { ValidationError } from "@domain/errors"
import {
  AccountApiKeysRepository,
  AccountsRepository,
  WalletsRepository,
} from "@services/mongoose"

export * from "./add-api-key-for-account"
export * from "./get-api-keys-for-account"
export * from "./disable-api-key-for-account"

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

  const accountRepo = AccountsRepository()
  return accountRepo.findById(accountApiKey.accountId)
}

export const hasPermissions = async (
  userId: UserId,
  walletPublicId: WalletPublicId,
): Promise<boolean | ApplicationError> => {
  const accounts = AccountsRepository()

  const userAccounts = await accounts.listByUserId(userId)
  if (userAccounts instanceof Error) return userAccounts

  const walletAccount = await accounts.findByWalletPublicId(walletPublicId)
  if (walletAccount instanceof Error) return walletAccount

  return userAccounts.some((a) => a.id === walletAccount.id)
}

export const getBusinessMapMarkers = async () => {
  const accounts = AccountsRepository()
  return accounts.listBusinessesForMap()
}

export const toWalletIds = async ({
  account,
  walletPublicIds,
}: {
  account: Account
  walletPublicIds: WalletPublicId[]
}): Promise<WalletId[] | ApplicationError> => {
  const wallets = WalletsRepository()

  const walletIds: WalletId[] = []

  for (const walletPublicId of walletPublicIds) {
    const wallet = await wallets.findByPublicId(walletPublicId)
    if (wallet instanceof Error) {
      return wallet
    }

    if (!account.walletIds.includes(wallet.id)) {
      return new ValidationError()
    }
    walletIds.push(wallet.id)
  }

  return walletIds
}
