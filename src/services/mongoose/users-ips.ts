import { User } from "@services/mongoose/schema"

import {
  CouldNotFindError,
  CouldNotFindUserFromIdError,
  PersistError,
  RepositoryError,
} from "@domain/errors"

import { fromObjectId, toObjectId, parseRepositoryError } from "./utils"

export const UsersIpRepository = (): IUsersIPsRepository => {
  const update = async (userIp: UserIPs): Promise<true | RepositoryError> => {
    try {
      const result = await User.updateOne(
        { _id: toObjectId<UserId>(userIp.id) },
        { $set: { lastConnection: new Date(), lastIPs: userIp.lastIPs } },
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
      return parseRepositoryError(err)
    }
  }

  return {
    update,
    findById,
  }
}

const userIPsFromRaw = (result: UserRecord): UserIPs => {
  return {
    id: fromObjectId<UserId>(result._id),
    lastIPs: (result.lastIPs || []) as IPType[],
  }
}
