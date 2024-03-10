import { User } from "./schema"

import { parseRepositoryError } from "./utils"

import { CouldNotFindUserFromPhoneError, RepositoryError } from "@/domain/errors"

export const translateToUser = (user: UserRecord): User => {
  const phoneMetadata = user.phoneMetadata
  const phone = user.phone as PhoneNumber | undefined
  const deletedPhones = user.deletedPhones as PhoneNumber[] | undefined
  const createdAt = user.createdAt
  const deviceId = user.deviceId as DeviceId | undefined
  const deletedEmails = user.deletedEmails as EmailAddress[] | undefined

  return {
    id: user.userId as UserId,
    phoneMetadata,
    phone,
    deletedPhones,
    createdAt,
    deviceId,
    deletedEmails,
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
      if (!result) return translateToUser({ userId: id, createdAt: new Date() })

      return translateToUser(result)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const findByFilter = async function* ({
    userIds,
    phoneCountryCodes,
  }: {
    userIds: UserId[]
    phoneCountryCodes: string[]
  }): AsyncGenerator<UserId> | RepositoryError {
    let conditions: (
      | { userId?: { $in: UserId[] } }
      | { "phoneMetadata.countryCode": { $in: string[] } }
    )[] = []

    if (userIds.length > 0) {
      conditions.push({ userId: { $in: userIds } })
    }

    if (phoneCountryCodes.length > 0) {
      conditions.push({ "phoneMetadata.countryCode": { $in: phoneCountryCodes } })
    }

    let query = conditions.length > 0 ? { $and: conditions } : {}

    try {
      const cursor = User.find(query).cursor()
      for await (const doc of cursor) {
        yield doc.userId as UserId
      }
    } catch (err) {
      return parseRepositoryError(err)
    }
  }
  // TODO: should be replaced with listIdentities({ credentialsIdentifiers: phone })
  const findByPhone = async (phone: PhoneNumber): Promise<User | RepositoryError> => {
    try {
      const result = await User.findOne({ phone })
      if (!result) return new CouldNotFindUserFromPhoneError()

      return translateToUser(result)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const update = async ({
    id,
    phoneMetadata,
    phone,
    deletedPhones,
    deviceId,
    deletedEmails,
  }: UserUpdateInput): Promise<User | RepositoryError> => {
    const updateObject: Partial<UserUpdateInput> & {
      $unset?: { phone?: number; email?: number }
    } = {
      phoneMetadata,
      deletedPhones,
      deletedEmails,
      deviceId,
    }

    // If the new phone is undefined, unset it from the document
    if (phone === undefined) {
      updateObject.$unset = { phone: 1 }
    } else {
      updateObject.phone = phone
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
    findByFilter,
    update,
  }
}
