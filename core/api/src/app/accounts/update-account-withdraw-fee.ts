import {
  checkedToAccountUuid,
  sanityCheckedDefaultAccountWithdrawFee,
} from "@/domain/accounts"
import { AccountsRepository } from "@/services/mongoose"

export const updateAccountWithdrawFee = async ({
  accountUuid: accountUuidRaw,
  fee,
}: {
  accountUuid: AccountUuid
  fee: number
}): Promise<Account | ApplicationError> => {
  const checkedFee = sanityCheckedDefaultAccountWithdrawFee(fee)
  if (checkedFee instanceof Error) return checkedFee

  const accountsRepo = AccountsRepository()

  const accountUuid = checkedToAccountUuid(accountUuidRaw)
  if (accountUuid instanceof Error) return accountUuid

  const account = await accountsRepo.findByUuid(accountUuid)
  if (account instanceof Error) return account

  account.withdrawFee = checkedFee

  return accountsRepo.update(account)
}
