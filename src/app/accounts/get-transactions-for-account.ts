import { AccountValidator } from "@domain/accounts"
import { RepositoryError } from "@domain/errors"
import { WalletsRepository } from "@services/mongoose"

import { getTransactionsForWallets } from "../wallets"
import { PartialResult } from "../partial-result"

export const getTransactionsForAccountByWalletIds = async ({
  account,
  walletIds,
}: {
  account: Account
  walletIds: WalletId[]
}): Promise<PartialResult<WalletTransaction[]>> => {
  const walletsRepo = WalletsRepository()

  const wallets: Wallet[] = []
  for (const walletId of walletIds) {
    const wallet = await walletsRepo.findById(walletId)
    if (wallet instanceof RepositoryError) return PartialResult.err(wallet)

    const accountValidator = AccountValidator(account)
    if (accountValidator instanceof Error) return PartialResult.err(accountValidator)
    const validateWallet = accountValidator.validateWalletForAccount(wallet)
    if (validateWallet instanceof Error) return PartialResult.err(validateWallet)

    wallets.push(wallet)
  }

  return getTransactionsForWallets(wallets)
}
