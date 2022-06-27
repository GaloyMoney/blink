import { checkedAccountStatus } from "@domain/accounts"
import {
  subjectIdFromUserId,
  resourceFromAccountId,
  // AccountPermission,
  AuthorizationError,
} from "@domain/authorization"
import { AccountsRepository } from "@services/mongoose"
import { CasbinService } from "@services/casbin"

export const updateAccountStatus = async ({
  id,
  status,
  updatedByUserId,
  comment,
}: {
  id: string
  status: string
  updatedByUserId: UserId
  comment?: string
}): Promise<Account | ApplicationError> => {
  // const permission = await CasbinService().checkPermission({
  //   subjectId: subjectIdFromUserId(updatedByUserId),
  //   resourceId: resourceFromAccountId(id as AccountId),
  //   permission: AccountPermission.StatusUpdate,
  // })
  // if (permission instanceof Error) return permission
  // if (!permission) return new AuthorizationError()

  const accountsRepo = AccountsRepository()
  const account = await accountsRepo.findById(id as AccountId)
  if (account instanceof Error) return account

  const statusChecked = checkedAccountStatus(status)
  if (statusChecked instanceof Error) return statusChecked

  account.statusHistory = (account.statusHistory ?? []).concat({
    status: statusChecked,
    updatedByUserId,
    comment,
  })
  return accountsRepo.update(account)
}
