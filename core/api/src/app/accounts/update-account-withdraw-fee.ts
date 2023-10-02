import { sanityCheckedDefaultAccountWithdrawFee } from "@domain/accounts"
import { AccountsRepository } from "@services/mongoose"

export const updateAccountWithdrawFee = async ({
  id,
  fee,
}: {
  id: AccountId
  fee: number
}): Promise<Account | ApplicationError> => {
  const checkedFee = sanityCheckedDefaultAccountWithdrawFee(fee)
  if (checkedFee instanceof Error) return checkedFee

  const accountsRepo = AccountsRepository()

  const account = await accountsRepo.findById(id)
  if (account instanceof Error) return account

  account.withdrawFee = checkedFee

  return accountsRepo.update(account)
}
