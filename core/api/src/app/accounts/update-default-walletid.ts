import { InvalidWalletId } from "@/domain/errors"
import { AccountsRepository, WalletsRepository } from "@/services/mongoose"

export const updateDefaultWalletId = async ({
  accountUuid,
  walletId,
}: {
  accountUuid: AccountUuid
  walletId: WalletId
}): Promise<Account | ApplicationError> => {
  const account = await AccountsRepository().findByUuid(accountUuid)
  if (account instanceof Error) return account

  const wallets = await WalletsRepository().listByAccountUuid(account.uuid)
  if (wallets instanceof Error) return wallets

  if (!wallets.some((w) => w.id === walletId)) return new InvalidWalletId()

  account.defaultWalletId = walletId

  return AccountsRepository().update(account)
}
