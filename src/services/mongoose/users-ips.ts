import { User } from "@services/mongoose/schema"

import {
  CouldNotFindError,
  CouldNotFindUserFromIdError,
  PersistError,
  RepositoryError,
  UnknownRepositoryError,
} from "@domain/errors"

import { toObjectId } from "./utils"

export const UsersIpRepository = (): IUsersIPsRepository => {
  const update = async (userIp: UserIPs): Promise<true | RepositoryError> => {
    try {
      const result = await User.updateOne(
        { _id: toObjectId<UserId>(userIp.id) },
        { $set: { lastConnection: new Date(), lastIPs: userIp.lastIPs } },
      )

      if (result.n === 0) {
        return new CouldNotFindError("Couldn't find user")
      }

      if (result.nModified !== 1) {
        return new PersistError("Couldn't update ip for user")
      }

      return true
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const findById = async (userId: UserId): Promise<UserIPs | RepositoryError> => {
    try {
      const result = await User.findOne(
        { _id: toObjectId<UserId>(userId) },
        { lastIPs: 1 },
      )
      if (!result) {
        return new CouldNotFindUserFromIdError(userId)
      }

      return userIPsFromRaw(result)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  return {
    update,
    findById,
  }
}

const userIPsFromRaw = (result: UserIPsType): UserIPs => {
  return {
    id: result.id as UserId,
    lastIPs: result.lastIPs as IPType[],
  }
}
