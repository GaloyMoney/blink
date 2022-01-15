import { InvalidWalletId } from "@domain/errors"
import { listWalletIdsByAccountId } from "@app/wallets"
import { AccountsRepository } from "@services/mongoose"

export const updateDefaultWalletId = async ({
  accountId,
  walletId,
}: {
  accountId: AccountId
  walletId: WalletId
}): Promise<Account | ApplicationError> => {
  const account = await AccountsRepository().findById(accountId)
  if (account instanceof Error) return account

  const walletIds = await listWalletIdsByAccountId(account.id)
  if (walletIds instanceof Error) return walletIds

  if (!walletIds.some((wid) => wid === walletId)) return new InvalidWalletId()

  account.defaultWalletId = walletId

  const result = await AccountsRepository().update(account)
  if (result instanceof Error) return result

  return result
}
