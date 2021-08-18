import { getUsernameRegex, UserLanguage } from "@domain/users"
import {
  UnknownRepositoryError,
  CouldNotFindError,
  RepositoryError,
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
      }
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const findByUsername = async (username: Username): Promise<User | RepositoryError> => {
    const regexUsername = getUsernameRegex()
    try {
      if (!username.match(regexUsername)) {
        return new CouldNotFindError("Invalid username")
      }

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
      }
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  return {
    findById,
    findByUsername,
  }
}
