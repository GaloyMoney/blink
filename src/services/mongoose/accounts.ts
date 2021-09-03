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
      const result: UserType = await User.findOne({ _id: accountId })
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

  const listBusinessesForMap = async (): Promise<
    BusinessMapMarker[] | RepositoryError
  > => {
    try {
      const accounts: UserType[] = await User.find(
        {
          title: { $exists: true },
          coordinate: { $exists: true },
        },
        { username: 1, title: 1, coordinate: 1 },
      )

      if (!accounts) {
        return new CouldNotFindError()
      }

      return accounts.map((account) => ({
        walletName: account.username as WalletName,
        mapInfo: {
          title: account.title as BusinessMapTitle,
          coordinates: account.coordinate as Coordinates,
        },
      }))
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }
  return {
    findById,
    listBusinessesForMap,
  }
}
