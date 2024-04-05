import { InvalidWalletId } from "@/domain/errors"
import { AccountsRepository, WalletsRepository } from "@/services/mongoose"

export const updateDefaultWalletId = async ({
  accountId,
  walletId,
}: {
  accountId: AccountId
  walletId: WalletId
}): Promise<Account | ApplicationError> => {
  const account = await AccountsRepository().findById(accountId)
  if (account instanceof Error) return account

  const wallets = await WalletsRepository().listByAccountId(account.id)
  if (wallets instanceof Error) return wallets

  if (!wallets.some((w) => w.id === walletId)) return new InvalidWalletId()

  account.defaultWalletId = walletId

  return AccountsRepository().update(account)
}
