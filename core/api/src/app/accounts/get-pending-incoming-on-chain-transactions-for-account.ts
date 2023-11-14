import { getPendingIncomingOnChainTransactionsForWallets } from "../wallets/get-pending-incoming-on-chain-transactions-for-wallets"

import { RepositoryError } from "@/domain/errors"
import { checkedToWalletId } from "@/domain/wallets"
import { WalletsRepository } from "@/services/mongoose"

export const getPendingIncomingOnChainTransactionsForAccountByWalletIds = async ({
  account,
  walletIds,
}: {
  account: Account
  walletIds?: string[]
}): Promise<WalletOnChainSettledTransaction[] | ApplicationError> => {
  const walletsRepo = WalletsRepository()

  const accountWallets = await walletsRepo.listByAccountId(account.id)
  if (accountWallets instanceof RepositoryError) return accountWallets

  if (!walletIds) {
    return getPendingIncomingOnChainTransactionsForWallets({ wallets: accountWallets })
  }

  const checkedWalletIds: WalletId[] = []

  for (const walletId of walletIds) {
    const checkedWalletId = checkedToWalletId(walletId)
    if (checkedWalletId instanceof Error) return checkedWalletId
    checkedWalletIds.push(checkedWalletId)
  }

  const selectedWallets = accountWallets.filter((wallet) =>
    checkedWalletIds.includes(wallet.id),
  )

  return getPendingIncomingOnChainTransactionsForWallets({ wallets: selectedWallets })
}
