import { updateAccountStatus } from "@/app/accounts"
import { AccountStatus } from "@/domain/accounts"
import { AccountsRepository } from "@/services/mongoose"

export const activateInvitedAccount = async (
  userId: UserId,
): Promise<Account | ApplicationError> => {
  const accountsRepo = AccountsRepository()

  const account = await accountsRepo.findByUserId(userId)

  if (account instanceof Error) return account

  if (account.status !== AccountStatus.Invited) return account

  return updateAccountStatus({
    accountId: account.id,
    status: AccountStatus.Active,
    comment: "Initial Status",
  })
}
