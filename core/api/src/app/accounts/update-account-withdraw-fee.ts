import {
  checkedToAccountId,
  sanityCheckedDefaultAccountWithdrawFee,
} from "@/domain/accounts"
import { AccountsRepository } from "@/services/mongoose"

export const updateAccountWithdrawFee = async ({
  accountId: AccountIdRaw,
  fee,
}: {
  accountId: AccountId
  fee: number
}): Promise<Account | ApplicationError> => {
  const checkedFee = sanityCheckedDefaultAccountWithdrawFee(fee)
  if (checkedFee instanceof Error) return checkedFee

  const accountsRepo = AccountsRepository()

  const accountId = checkedToAccountId(AccountIdRaw)
  if (accountId instanceof Error) return accountId

  const account = await accountsRepo.findById(accountId)
  if (account instanceof Error) return account

  account.withdrawFee = checkedFee

  return accountsRepo.update(account)
}
