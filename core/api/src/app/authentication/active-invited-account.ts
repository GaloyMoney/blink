import { AccountStatus } from "@/domain/accounts"
import { AccountsRepository } from "@/services/mongoose"

export const activeInvitedAccount = async (
  userId: UserId,
): Promise<Account | ApplicationError> => {
  const accountsRepo = AccountsRepository()

  const account = await accountsRepo.findByUserId(userId)

  if (account instanceof Error) return account

  if (account.status !== AccountStatus.Invited) return account

  account.statusHistory = (account.statusHistory ?? []).concat({
    status: AccountStatus.Active,
    comment: "Initial Status",
  })

  return accountsRepo.update(account)
}
