import { getTransactionsForWallets } from "../wallets"

import { AccountValidator } from "@/domain/accounts"
import { RepositoryError } from "@/domain/errors"
import { WalletsRepository } from "@/services/mongoose"

export const getTransactionsForAccountByWalletIds = async ({
  account,
  walletIds,
  rawPaginationArgs,
}: {
  account: Account
  walletIds?: WalletId[]
  rawPaginationArgs: RawPaginationArgs
}): Promise<PaginatedQueryResult<WalletTransaction> | ApplicationError> => {
  const walletsRepo = WalletsRepository()

  const wallets: Wallet[] = []

  if (walletIds) {
    for (const walletId of walletIds) {
      const wallet = await walletsRepo.findById(walletId)
      if (wallet instanceof RepositoryError) return wallet

      const accountValidator = AccountValidator(account)
      if (accountValidator instanceof Error) return accountValidator
      const validateWallet = accountValidator.validateWalletForAccount(wallet)
      if (validateWallet instanceof Error) return validateWallet

      wallets.push(wallet)
    }
  } else {
    const accountWallets = await walletsRepo.listByAccountId(account.id)
    if (accountWallets instanceof RepositoryError) return accountWallets
    wallets.push(...accountWallets)
  }

  return getTransactionsForWallets({ wallets, rawPaginationArgs })
}
