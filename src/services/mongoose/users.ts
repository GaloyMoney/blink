import {
  CouldNotFindUserFromIdError,
  CouldNotFindUserFromPhoneError,
  RepositoryError,
} from "@domain/errors"
import { User } from "@services/mongoose/schema"

import { fromObjectId, toObjectId, parseRepositoryError } from "./utils"

export const UsersRepository = (): IUsersRepository => {
  const findById = async (userId: UserId): Promise<User | RepositoryError> => {
    try {
      const result = await User.findOne({ _id: toObjectId<UserId>(userId) }, projection)

      if (!result) {
        return new CouldNotFindUserFromIdError(userId)
      }

      return userFromRaw(result)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const findByPhone = async (phone: PhoneNumber): Promise<User | RepositoryError> => {
    try {
      const result = await User.findOne({ phone }, projection)
      if (!result) {
        return new CouldNotFindUserFromPhoneError(phone)
      }

      return userFromRaw(result)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const update = async ({
    id,
    phone,
    language,
    deviceTokens,
  }: User): Promise<User | RepositoryError> => {
    try {
      const data = {
        phone,
        language,
        deviceToken: deviceTokens,
      }
      const result = await User.findOneAndUpdate({ _id: toObjectId<UserId>(id) }, data, {
        projection,
        new: true,
      })
      if (!result) {
        return new RepositoryError("Couldn't update user")
      }
      return userFromRaw(result)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  return {
    findById,
    findByPhone,
    update,
  }
}

const userFromRaw = (result: UserRecord): User => ({
  id: fromObjectId<UserId>(result._id),
  phone: result.phone as PhoneNumber,
  language: result.language as UserLanguage,
  defaultAccountId: fromObjectId<AccountId>(result._id),
  deviceTokens: (result.deviceToken || []) as DeviceToken[],
  createdAt: new Date(result.created_at),
  phoneMetadata: result.twilio as PhoneMetadata,
})

const projection = {
  phone: 1,
  language: 1,
  twoFA: 1,
  deviceToken: 1,
  created_at: 1,
  twilio: 1,
}
