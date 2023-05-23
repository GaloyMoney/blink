import {
  CouldNotUnsetPhoneFromUserError,
  CouldNotFindUserFromPhoneError,
  CouldNotFindUserFromDeviceError,
  RepositoryError,
} from "@domain/errors"

import { checkedToDeviceId } from "@domain/accounts"

import { ValidationError } from "@domain/shared"

import { User } from "./schema"

import { parseRepositoryError } from "./utils"

export const translateToUser = (user: UserRecord): User => {
  const language = (user?.language ?? "") as UserLanguageOrEmpty
  const deviceTokens = user.deviceTokens ?? []
  const phoneMetadata = user.phoneMetadata
  const phone = user.phone
  const deviceId = user.deviceId
  const createdAt = user.createdAt

  return {
    id: user.userId as UserId,
    language,
    deviceTokens: deviceTokens as DeviceToken[],
    phoneMetadata,
    phone,
    deviceId,
    createdAt,
  }
}

export const UsersRepository = (): IUsersRepository => {
  const findById = async (id: UserId): Promise<User | RepositoryError> => {
    try {
      const result = await User.findOne({ userId: id })

      // return default values if not present
      // we can do because user collection is an optional collection from the backend
      // as authentication is handled outside the stack
      // and user collection is only about metadata for notification and language
      if (!result)
        return translateToUser({ userId: id, deviceTokens: [], createdAt: new Date() })

      return translateToUser(result)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const findByPhone = async (phone: PhoneNumber): Promise<User | RepositoryError> => {
    try {
      const result = await User.findOne({ phone })
      if (!result) return new CouldNotFindUserFromPhoneError()

      return translateToUser(result)
    } catch (err) {
      //  else
      return parseRepositoryError(err)
    }
  }

  const findByDeviceId = async (deviceId: DeviceId): Promise<User | RepositoryError> => {
    try {
      const result = await User.findOne({ deviceId })
      if (!result) return new CouldNotFindUserFromDeviceError()

      return translateToUser(result)
    } catch (err) {
      //  else
      return parseRepositoryError(err)
    }
  }

  const update = async ({
    id,
    language,
    deviceTokens,
    phoneMetadata,
    phone,
    deviceId,
    createdAt,
  }: UserUpdateInput): Promise<User | RepositoryError> => {
    try {
      const result = await User.findOneAndUpdate(
        { userId: id },
        {
          deviceTokens,
          phoneMetadata,
          language,
          phone,
          deviceId,
          createdAt, // TODO: remove post migration
        },
        {
          new: true,
          upsert: true,
        },
      )
      if (!result) {
        return new RepositoryError("Couldn't update user")
      }
      return translateToUser(result)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const adminUnsetPhoneForUserPreservation = async (
    id: UserId,
  ): Promise<User | RepositoryError> => {
    try {
      const result = await User.findOneAndUpdate(
        { userId: id },
        { $unset: { phone: true } },
        { new: true },
      )
      if (!result) {
        return new CouldNotUnsetPhoneFromUserError()
      }
      return translateToUser(result)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const unsetDeviceIdForUser = async (id: UserId): Promise<User | RepositoryError> => {
    try {
      const result = await User.findOneAndUpdate(
        { userId: id },
        { $unset: { deviceId: true } },
        { new: true },
      )
      if (!result) {
        return new CouldNotUnsetPhoneFromUserError()
      }
      return translateToUser(result)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  return {
    findById,
    findByPhone,
    findByDeviceId,
    update,
    adminUnsetPhoneForUserPreservation,
    unsetDeviceIdForUser,
  }
}
