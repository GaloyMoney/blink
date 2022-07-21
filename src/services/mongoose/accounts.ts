import { AccountLevel, AccountStatus } from "@domain/accounts"
import {
  CouldNotFindAccountFromUsernameError,
  CouldNotFindError,
  RepositoryError,
  UnknownRepositoryError,
} from "@domain/errors"

import { User } from "@services/mongoose/schema"

import { toObjectId, fromObjectId } from "./utils"

import { caseInsensitiveRegex } from "."

export const AccountsRepository = (): IAccountsRepository => {
  const listUnlockedAccounts = async (): Promise<Account[] | RepositoryError> => {
    try {
      const result: UserRecord[] /* UserRecord actually not correct with {projection} */ =
        await User.find(
          { $expr: { $eq: [{ $last: "$statusHistory.status" }, AccountStatus.Active] } },
          projection,
        )
      if (result.length === 0) return new CouldNotFindError()
      return result.map((a) => translateToAccount(a))
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const findById = async (accountId: AccountId): Promise<Account | RepositoryError> => {
    try {
      const result: UserRecord | null /* UserRecord actually not correct with {projection} */ =
        await User.findOne({ _id: toObjectId<AccountId>(accountId) }, projection)
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

  const findByUserId = async (userId: UserId): Promise<Account | RepositoryError> => {
    return findById(userId as string as AccountId)
  }

  // FIXME: could be in a different file? does not return an Account
  const listBusinessesForMap = async (): Promise<
    BusinessMapMarker[] | RepositoryError
  > => {
    try {
      const accounts = await User.find(
        {
          title: { $exists: true, $ne: undefined },
          coordinates: { $exists: true, $ne: undefined },
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
    statusHistory,
    coordinates,
    contacts,
    title,
    username,
    defaultWalletId,
    withdrawFee,
  }: Account): Promise<Account | RepositoryError> => {
    try {
      const result = await User.findOneAndUpdate(
        { _id: toObjectId<AccountId>(id) },
        {
          level,
          statusHistory,
          coordinates,
          title,
          username,
          contacts: contacts.map(
            ({ username, alias, transactionsCount }: AccountContact) => ({
              id: username,
              name: alias,
              transactionsCount,
            }),
          ),
          defaultWalletId,
          withdrawFee,
        },
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
    findByUsername,
    listBusinessesForMap,
    update,
  }
}

const translateToAccount = (result: UserRecord): Account => ({
  id: fromObjectId<AccountId>(result._id),
  createdAt: new Date(result.created_at),
  defaultWalletId: result.defaultWalletId as WalletId,
  username: result.username as Username,
  level: (result.level as AccountLevel) || AccountLevel.One,
  status: result.statusHistory.slice(-1)[0].status,
  statusHistory: (result.statusHistory || []) as AccountStatusHistory,
  title: result.title as BusinessMapTitle,
  coordinates: result.coordinates as Coordinates,
  ownerId: fromObjectId<UserId>(result._id),
  contacts: result.contacts.reduce(
    (res: AccountContact[], contact: ContactObjectForUser): AccountContact[] => {
      if (contact.id) {
        res.push({
          id: contact.id as Username,
          username: contact.id as Username,
          alias: (contact.name || contact.id) as ContactAlias,
          transactionsCount: contact.transactionsCount,
        })
      }
      return res
    },
    [],
  ),
  depositFeeRatio: result.depositFeeRatio as DepositFeeRatio,
  withdrawFee: result.withdrawFee as Satoshis,
})

const projection = {
  level: 1,
  statusHistory: 1,
  coordinates: 1,
  defaultWalletId: 1,
  username: 1,
  title: 1,
  created_at: 1,
  contacts: 1,
  depositFeeRatio: 1,
  withdrawFee: 1,
}
