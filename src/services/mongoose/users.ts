import { getLocale } from "@config"
import { RepositoryError } from "@domain/errors"

import { User } from "./schema"

import { parseRepositoryError } from "./utils"

export const translateToUser = (user: UserRecord): User => {
  const language = (user?.language ?? "") as UserLanguageOrEmpty
  const languageOrDefault = language === "" ? getLocale() : language
  const deviceTokens = user.deviceTokens ?? []
  const phoneMetadata = user.phoneMetadata

  return {
    id: user.userId as KratosUserId,
    language: language,
    languageOrDefault: languageOrDefault as UserLanguage,
    deviceTokens: deviceTokens as DeviceToken[],
    phoneMetadata,
  }
}

export const UsersRepository = (): IUserRepository => {
  const findById = async (id: KratosUserId): Promise<User | RepositoryError> => {
    try {
      const result = await User.findOne({ userId: id })
      if (!result) return translateToUser({ userId: id, deviceTokens: [] })

      return translateToUser(result)
    } catch (err) {
      //  else
      return parseRepositoryError(err)
    }
  }

  const list = async (): Promise<User[] | RepositoryError> => {
    try {
      const result = await User.find({})
      return result.map((a) => translateToUser(a))
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const update = async ({
    id,
    language,
    deviceTokens,
    phoneMetadata,
  }: UserUpdateInput): Promise<User | RepositoryError> => {
    try {
      const result = await User.findOneAndUpdate(
        { userId: id },
        {
          deviceTokens,
          phoneMetadata,
          language,
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

  return {
    findById,
    list,
    update,
  }
}
