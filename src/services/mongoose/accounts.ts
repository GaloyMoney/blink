import { AccountLevel, AccountStatus } from "@domain/accounts"
import {
  UnknownRepositoryError,
  CouldNotFindError,
  RepositoryError,
  CouldNotFindAccountFromUsernameError,
  CouldNotFindAccountFromPhoneError,
} from "@domain/errors"
import { User } from "@services/mongoose/schema"
import { caseInsensitiveRegex } from "."

const projection = {
  level: 1,
  status: 1,
  coordinate: 1,
  walletPublicId: 1,
  username: 1,
  language: 1,
  title: 1,
  created_at: 1,
}

export const AccountsRepository = (): IAccountsRepository => {
  const findById = async (accountId: AccountId): Promise<Account | RepositoryError> => {
    try {
      const result: UserType = await User.findOne({ _id: accountId }, projection)
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
      const result: UserType = await User.findOne({ _id: walletId }, projection)
      if (!result) return new CouldNotFindError()
      return translateToAccount(result)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const findByUsername = async (
    username: Username,
  ): Promise<Account | RepositoryError> => {
    try {
      const result = await User.findOne(
        { username: caseInsensitiveRegex(username) },
        projection,
      )
      if (!result) {
        return new CouldNotFindAccountFromUsernameError(username)
      }
      return translateToAccount(result)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const findByPhone = async (phone: PhoneNumber): Promise<Account | RepositoryError> => {
    try {
      const result = await User.findOne({ phone })
      if (!result) {
        return new CouldNotFindAccountFromPhoneError(phone)
      }

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
      const result: UserType = await User.findOne(
        {
          walletPublicId,
        },
        projection,
      )
      if (!result) return new CouldNotFindError("Invalid wallet")
      return translateToAccount(result)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  // FIXME: could be in a different file? does not return an Account
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

  // currently only used by Admin
  const update = async ({
    id,
    level,
    status,
    coordinate,
    title,
  }: Account): Promise<Account | Error> => {
    try {
      const result = await User.findOneAndUpdate(
        { _id: id },
        { level, status, coordinate, title },
        {
          new: true,
          projection,
        },
      )
      if (!result) {
        return new RepositoryError("Couldn't update user")
      }
      return translateToAccount(result)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  return {
    findById,
    listByUserId,
    findByWalletId,
    findByUsername,
    findByPhone,
    findByWalletPublicId,
    listBusinessesForMap,
    update,
  }
}

const translateToAccount = (result): Account => ({
  id: result.id as AccountId,
  createdAt: new Date(result.created_at),
  walletPublicId: result.walletPublicId as WalletPublicId,
  username: result.username as Username,
  language: result.langugage as UserLanguage,
  level: (result.level as AccountLevel) || AccountLevel.One,
  status: (result.status as AccountStatus) || AccountStatus.Active,
  title: result.title as BusinessMapTitle,
  coordinate: result.coordinate as Coordinates,
  walletIds: [result.id as WalletId],
})
