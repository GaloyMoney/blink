import { Account } from "@services/mongoose/schema"

import {
  CouldNotFindError,
  CouldNotFindUserFromIdError,
  PersistError,
  RepositoryError,
} from "@domain/errors"

import { fromObjectId, toObjectId, parseRepositoryError } from "./utils"

export const AccountsIpRepository = (): IAccountsIPsRepository => {
  const update = async (accountIps: AccountOptIps): Promise<true | RepositoryError> => {
    try {
      const set = accountIps.lastIPs
        ? {
            lastConnection: new Date(),
            lastIPs: accountIps.lastIPs,
          }
        : {
            lastConnection: new Date(),
          }

      const result = await Account.updateOne(
        { _id: toObjectId<AccountId>(accountIps.id) },
        { $set: set },
      )

      if (result.matchedCount === 0) {
        return new CouldNotFindError("Couldn't find user")
      }

      if (result.modifiedCount !== 1) {
        return new PersistError("Couldn't update ip for user")
      }

      return true
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const findById = async (
    accountId: AccountId,
  ): Promise<AccountIPs | RepositoryError> => {
    try {
      const result = await Account.findOne(
        { _id: toObjectId<AccountId>(accountId) },
        { lastIPs: 1 },
      )
      if (!result) {
        return new CouldNotFindUserFromIdError(accountId)
      }

      return userIPsFromRaw(result)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  return {
    update,
    findById,
  }
}

const userIPsFromRaw = (result: AccountRecord): AccountIPs => {
  return {
    id: fromObjectId<AccountId>(result._id),
    lastIPs: (result.lastIPs || []) as IPType[],
  }
}
