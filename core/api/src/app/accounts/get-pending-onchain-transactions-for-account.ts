import { getPendingOnChainTransactionsForWallets } from "../wallets/get-pending-onchain-transactions-for-wallets"

import { AccountValidator } from "@/domain/accounts"
import { RepositoryError } from "@/domain/errors"
import { WalletsRepository } from "@/services/mongoose"
import { checkedToWalletId } from "@/domain/wallets"

export const getPendingOnChainTransactionsForAccountByWalletIds = async ({
  account,
  walletIds,
}: {
  account: Account
  walletIds: string[]
}): Promise<WalletOnChainSettledTransaction[] | ApplicationError> => {
  const walletsRepo = WalletsRepository()

  const wallets: Wallet[] = []
  for (const uncheckedWalletId of walletIds) {
    const walletId = checkedToWalletId(uncheckedWalletId)
    if (walletId instanceof Error) return walletId
    const wallet = await walletsRepo.findById(walletId)
    if (wallet instanceof RepositoryError) return wallet

    const accountValidator = AccountValidator(account)
    if (accountValidator instanceof Error) return accountValidator
    const validateWallet = accountValidator.validateWalletForAccount(wallet)
    if (validateWallet instanceof Error) return validateWallet

    wallets.push(wallet)
  }

  return getPendingOnChainTransactionsForWallets({ wallets })
}
