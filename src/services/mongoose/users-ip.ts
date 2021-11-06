import { User } from "@services/mongoose/schema"
import {
  CouldNotFindError,
  CouldNotFindUserFromIdError,
  PersistError,
  RepositoryError,
  UnknownRepositoryError,
} from "@domain/errors"

export const UsersIpRepository = (): IUsersIpRepository => {
  const update = async (
    userId: UserId,
    lastConnection: Date,
    lastIPs?: IPType[],
  ): Promise<true | RepositoryError> => {
    try {
      const result = await User.updateOne(
        { _id: userId },
        { $set: { lastConnection, lastIPs } },
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

  const findById = async (userId: UserId): Promise<UserIp | RepositoryError> => {
    try {
      const result = await User.findOne({ _id: userId }, { lastIPs: 1 })
      if (!result) {
        return new CouldNotFindUserFromIdError(userId)
      }

      return userFromRaw(result)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  return {
    update,
    findById,
  }
}

const userFromRaw = (result: UserIpType): UserIp => {
  return {
    id: result.id as UserId,
    lastIPs: (result.lastIPs || []) as IPType[],
  }
}
