import { onboardingEarn } from "@config/app"
import { toSats } from "@domain/bitcoin"
import {
  CouldNotFindUserFromIdError,
  CouldNotFindUserFromPhoneError,
  RepositoryError,
  UnknownRepositoryError,
} from "@domain/errors"
import { User } from "@services/mongoose/schema"

import { toObjectId, fromObjectId } from "./utils"

export const caseInsensitiveRegex = (input: string) => {
  return new RegExp(`^${input}$`, "i")
}

export const UsersRepository = (): IUsersRepository => {
  const findById = async (userId: UserId): Promise<User | RepositoryError> => {
    try {
      const result = await User.findOne({ _id: toObjectId<UserId>(userId) }, projection)

      if (!result) {
        return new CouldNotFindUserFromIdError(userId)
      }

      return userFromRaw(result)
    } catch (err) {
      return new UnknownRepositoryError(err)
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
      return new UnknownRepositoryError(err)
    }
  }

  const persistNew = async ({
    phone,
    phoneMetadata,
  }: NewUserInfo): Promise<User | RepositoryError> => {
    try {
      const user = new User()
      user.phone = phone
      user.twilio = phoneMetadata
      await user.save()
      return userFromRaw(user)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const update = async ({
    id,
    phone,
    language,
    deviceTokens,
    twoFA,
  }: User): Promise<User | RepositoryError> => {
    try {
      const data = {
        phone,
        language,
        deviceToken: deviceTokens,
        twoFA,
      }
      const result = await User.findOneAndUpdate({ _id: toObjectId<UserId>(id) }, data, {
        projection,
        new: 1,
      })
      if (!result) {
        return new RepositoryError("Couldn't update user")
      }
      return userFromRaw(result)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  return {
    findById,
    findByPhone,
    persistNew,
    update,
  }
}

const userFromRaw = (result: UserRecord): User => ({
  id: fromObjectId<UserId>(result._id),
  phone: result.phone as PhoneNumber,
  language: result.language as UserLanguage,
  twoFA: result.twoFA as TwoFAForUser,
  quizQuestions:
    result.earn?.map(
      (questionId: string): UserQuizQuestion => ({
        question: {
          id: questionId as QuizQuestionId,
          earnAmount: toSats(onboardingEarn[questionId]),
        },
        completed: true,
      }),
    ) || [],
  defaultAccountId: fromObjectId<AccountId>(result._id),
  deviceTokens: (result.deviceToken || []) as DeviceToken[],
  createdAt: new Date(result.created_at),
  phoneMetadata: result.twilio as PhoneMetadata,
})

const projection = {
  phone: 1,
  language: 1,
  twoFA: 1,
  earn: 1,
  deviceToken: 1,
  created_at: 1,
  twilio: 1,
}
