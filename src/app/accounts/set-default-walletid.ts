import { InvalidWalletId } from "@domain/errors"
import { AccountsRepository } from "@services/mongoose"

export const setDefaultWalletId = async ({
  accountId,
  walletId,
}: {
  accountId: AccountId
  walletId: WalletId
}) => {
  const account = await AccountsRepository().findById(accountId)
  if (account instanceof Error) return account

  if (!account.walletIds.some((wid) => wid === walletId)) return InvalidWalletId

  account.defaultWalletId = walletId

  const result = await AccountsRepository().update(account)
  if (result instanceof Error) return result

  return result
}
