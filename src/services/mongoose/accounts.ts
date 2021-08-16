import { AccountLevel, AccountStatus } from "@domain/accounts"
import {
  UnknownRepositoryError,
  CouldNotFindError,
  RepositoryError,
} from "@domain/errors"
import { User } from "@services/mongoose/schema"

export const AccountsRepository = (): IAccountsRepository => {
  const findById = async (accountId: AccountId): Promise<Account | RepositoryError> => {
    try {
      const result = await User.findOne({ _id: accountId })
      if (!result) {
        return new CouldNotFindError()
      }

      return {
        id: accountId,
        level: (result.level as AccountLevel) || AccountLevel.One,
        status: (result.status as AccountStatus) || AccountStatus.Active,
        walletIds: [result.id as WalletId],
      }
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  return {
    findById,
  }
}
