import { AccountLevel, AccountStatus } from "@domain/accounts"
import {
  CouldNotFindAccountFromUsernameError,
  CouldNotFindError,
  RepositoryError,
  UnknownRepositoryError,
} from "@domain/errors"
import { User } from "@services/mongoose/schema"

import { caseInsensitiveRegex } from "."

const projection = {
  level: 1,
  status: 1,
  coordinates: 1,
  walletId: 1,
  username: 1,
  title: 1,
  created_at: 1,
}

export const AccountsRepository = (): IAccountsRepository => {
  const listUnlockedAccounts = async (): Promise<Account[] | RepositoryError> => {
    try {
      const result: UserType[] /* UserType actually not correct with {projection} */ =
        await User.find({ status: AccountStatus.Active }, projection)
      if (result.length === 0) return new CouldNotFindError()
      return result.map((a) => translateToAccount(a))
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const findById = async (accountId: AccountId): Promise<Account | RepositoryError> => {
    try {
      const result: UserType /* UserType actually not correct with {projection} */ =
        await User.findOne({ _id: accountId }, projection)
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
      const result: UserType = await User.findOne({ walletId }, projection)
      if (!result) return new CouldNotFindError("Invalid wallet")
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

  const findByUserId = async (userId: UserId): Promise<Account | RepositoryError> => {
    const accountId = `${userId}` as AccountId
    const account = await findById(accountId)
    if (account instanceof Error) return account
    return account
  }

  // FIXME: could be in a different file? does not return an Account
  const listBusinessesForMap = async (): Promise<
    BusinessMapMarker[] | RepositoryError
  > => {
    try {
      const accounts: UserType[] = await User.find(
        {
          title: { $exists: true },
          coordinates: { $exists: true },
        },
        { username: 1, title: 1, coordinates: 1 },
      )

      if (!accounts) {
        return new CouldNotFindError()
      }

      return accounts.map((account) => ({
        username: account.username as Username,
        mapInfo: {
          title: account.title as BusinessMapTitle,
          coordinates: account.coordinates as Coordinates,
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
    coordinates,
    title,
    username,
  }: Account): Promise<Account | RepositoryError> => {
    try {
      const result = await User.findOneAndUpdate(
        { _id: id },
        { level, status, coordinates, title, username },
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
    listUnlockedAccounts,
    findById,
    findByUserId,
    findByWalletId,
    findByUsername,
    listBusinessesForMap,
    update,
  }
}

const translateToAccount = (result: UserType): Account => ({
  id: result.id as AccountId,
  createdAt: new Date(result.created_at),
  defaultWalletId: result.walletId as WalletId, // TODO: add defaultWalletId at the persistence layer when Account have multiple wallet
  username: result.username as Username,
  level: (result.level as AccountLevel) || AccountLevel.One,
  status: (result.status as AccountStatus) || AccountStatus.Active,
  title: result.title as BusinessMapTitle,
  coordinates: result.coordinates as Coordinates,
  walletIds: [result.walletId as WalletId],
  ownerId: result.id as UserId,
})
