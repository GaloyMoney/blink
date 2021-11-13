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
      const result: UserType = await User.findOne(
        { _id: accountId },
        { lastIPs: 0, lastConnection: 0 },
      )
      if (!result) return new CouldNotFindError()
      return translateToAccount(result)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const findByWalletId = async (
    walletId: WalletId,
  ): Promise<Account | RepositoryError> => {
    try {
      const result: UserType = await User.findOne(
        { _id: walletId },
        { lastIPs: 0, lastConnection: 0 },
      )
      if (!result) return new CouldNotFindError()
      return translateToAccount(result)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const listByUserId = async (userId: UserId): Promise<Account[] | RepositoryError> => {
    const accountId = `${userId}` as AccountId
    const account = await findById(accountId)
    if (account instanceof Error) return account
    return [account]
  }

  const findByWalletPublicId = async (
    walletPublicId: WalletPublicId,
  ): Promise<Account | RepositoryError> => {
    try {
      const result: UserType = await User.findOne({
        walletPublicId,
      })
      if (!result) return new CouldNotFindError("Invalid wallet")
      return translateToAccount(result)
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
        username: account.username as Username,
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
    listByUserId,
    findByWalletId,
    findByWalletPublicId,
    listBusinessesForMap,
  }
}

const translateToAccount = (result): Account => ({
  id: result.id as AccountId,
  level: (result.level as AccountLevel) || AccountLevel.One,
  status: (result.status as AccountStatus) || AccountStatus.Active,
  walletIds: [result.id as WalletId],
})
