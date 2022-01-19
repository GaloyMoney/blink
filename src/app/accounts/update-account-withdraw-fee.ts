import { AccountsRepository } from "@services/mongoose"

export const updateAccountWithdrawFee = async ({
  id,
  fee,
}: {
  id: AccountId
  fee: number
}): Promise<Account | ApplicationError> => {
  const accountsRepo = AccountsRepository()

  const account = await accountsRepo.findById(id)
  if (account instanceof Error) return account

  account.withdrawFee = fee as WithdrawFee

  return accountsRepo.update(account)
}
