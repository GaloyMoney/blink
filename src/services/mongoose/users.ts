import {
  CouldNotFindUserFromEmailError,
  CouldNotFindUserFromPhoneError,
  RepositoryError,
} from "@domain/errors"

import { User } from "./schema"

import { parseRepositoryError } from "./utils"

export const translateToUser = (user: UserRecord): User => {
  const language = (user?.language ?? "") as UserLanguageOrEmpty
  const deviceTokens = user.deviceTokens ?? []
  const phoneMetadata = user.phoneMetadata
  const phone = user.phone as PhoneNumber | undefined
  const deletedPhones = user.deletedPhones as PhoneNumber[] | undefined
  const createdAt = user.createdAt
  const deviceId = user.deviceId as DeviceId | undefined
  const email = user.email as EmailAddress | undefined

  return {
    id: user.userId as UserId,
    language,
    deviceTokens: deviceTokens as DeviceToken[],
    phoneMetadata,
    phone,
    deletedPhones,
    createdAt,
    deviceId,
    email,
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
      return parseRepositoryError(err)
    }
  }

  const findByEmail = async (email: EmailAddress): Promise<User | RepositoryError> => {
    try {
      const result = await User.findOne({ email })
      if (!result) return new CouldNotFindUserFromEmailError()

      return translateToUser(result)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const update = async ({
    id,
    language,
    deviceTokens,
    phoneMetadata,
    phone,
    deletedPhones,
    deviceId,
    email,
    deletedEmails,
  }: UserUpdateInput): Promise<User | RepositoryError> => {
    const updateObject: Partial<UserUpdateInput> & {
      $unset?: { phone?: number; email?: number }
    } = {
      deviceTokens,
      phoneMetadata,
      language,
      deletedPhones,
      deletedEmails,
      deviceId,
      email,
    }

    // If the new phone is undefined, unset it from the document
    if (phone === undefined) {
      updateObject.$unset = { phone: 1 }
    } else {
      updateObject.phone = phone
    }

    // If the new email is undefined, unset it from the document
    if (email === undefined) {
      updateObject.$unset = { email: 1 }
    } else {
      updateObject.email = email
    }

    try {
      const result = await User.findOneAndUpdate({ userId: id }, updateObject, {
        new: true,
        upsert: true,
      })
      if (!result) {
        return new RepositoryError("Couldn't update user")
      }
      return translateToUser(result)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  return {
    findById,
    findByPhone,
    findByEmail,
    update,
  }
}
