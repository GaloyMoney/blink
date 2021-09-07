import { AccountLevel, AccountStatus } from "@domain/accounts"
import {
  UnknownRepositoryError,
  CouldNotFindError,
  RepositoryError,
} from "@domain/errors"
import { User } from "@services/mongoose/schema"
import { caseInsensitiveRegex } from "."

export const AccountsRepository = (): IAccountsRepository => {
  const findById = async (accountId: AccountId): Promise<Account | RepositoryError> => {
    try {
      const result: UserType = await User.findOne({ _id: accountId })
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
      const result: UserType = await User.findOne({ _id: walletId })
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

  const findByWalletName = async (
    walletName: WalletName,
  ): Promise<Account | RepositoryError> => {
    try {
      const result: UserType = await User.findOne({
        username: caseInsensitiveRegex(walletName),
      })
      if (!result) return new CouldNotFindError("Invalid walletName")
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
    listByUserId,
    findByWalletName,
    findByWalletId,
    listBusinessesForMap,
  }
}

const translateToAccount = (result): Account => ({
  id: result.id as AccountId,
  level: (result.level as AccountLevel) || AccountLevel.One,
  status: (result.status as AccountStatus) || AccountStatus.Active,
  walletIds: [result.id as WalletId],
})
