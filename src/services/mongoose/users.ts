import { UserLanguage } from "@domain/users"
import {
  UnknownRepositoryError,
  CouldNotFindError,
  RepositoryError,
  CouldNotPersistError,
} from "@domain/errors"
import { User } from "@services/mongoose/schema"

export const caseInsensitiveRegex = (input) => {
  return new RegExp(`^${input}$`, "i")
}

export const UsersRepository = (): IUsersRepository => {
  const findById = async (userId: UserId): Promise<User | RepositoryError> => {
    try {
      const result = await User.findOne({ _id: userId })
      if (!result) {
        return new CouldNotFindError()
      }

      return {
        id: userId,
        username: (result.username as Username) || null,
        phone: result.phone as PhoneNumber,
        language: result.language || UserLanguage.EN_US,
        defaultAccountId: result.id as AccountId,
        createdAt: result.created_at,
        coordinate: result.coordinate || null,
        title: result.title || null,
      }
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const findByUsername = async (username: Username): Promise<User | RepositoryError> => {
    try {
      const result = await User.findOne({ username: caseInsensitiveRegex(username) })
      if (!result) {
        return new CouldNotFindError()
      }

      return {
        id: result.id as UserId,
        username,
        phone: result.phone as PhoneNumber,
        language: result.language || UserLanguage.EN_US,
        defaultAccountId: result.id as AccountId,
        createdAt: result.created_at,
        coordinate: result.coordinate || null,
        title: result.title || null,
      }
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const update = async (userUpdate: User): Promise<User | RepositoryError> => {
    try {
      if (!userUpdate?.id)
        return new CouldNotPersistError("User Id missing from update object")

      const result = await User.findOneAndUpdate({ _id: userUpdate.id }, userUpdate)
      if (!result) return new CouldNotPersistError(result)

      return {
        id: result.id as UserId,
        username: (result.username as Username) || null,
        phone: result.phone as PhoneNumber,
        language: result.language || UserLanguage.EN_US,
        defaultAccountId: result.id as AccountId,
        createdAt: result.created_at,
        coordinate: result.coordinate || null,
        title: result.title || null,
      }
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  return {
    findById,
    findByUsername,
    update,
  }
}
