import { getInvoicesForWallets } from "../wallets"

import { RepositoryError } from "@/domain/errors"
import { WalletsRepository } from "@/services/mongoose"

export const getInvoicesForAccountByWalletIds = async ({
  account,
  walletIds,
  rawPaginationArgs,
}: {
  account: Account
  walletIds?: WalletId[]
  rawPaginationArgs: RawPaginationArgs
}): Promise<PaginatedQueryResult<WalletInvoice> | ApplicationError> => {
  const walletsRepo = WalletsRepository()

  const accountWallets = await walletsRepo.listByAccountId(account.id)
  if (accountWallets instanceof RepositoryError) return accountWallets

  const wallets = accountWallets.filter((wallet) =>
    walletIds ? walletIds.includes(wallet.id) : true,
  )

  return getInvoicesForWallets({ wallets, rawPaginationArgs })
}
