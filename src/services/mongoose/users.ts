import { UserLanguage } from "@domain/users"
import { toSats } from "@domain/bitcoin"
import {
  UnknownRepositoryError,
  CouldNotFindError,
  RepositoryError,
} from "@domain/errors"
import { User } from "@services/mongoose/schema"
import { onboardingEarn } from "@config/app"

export const caseInsensitiveRegex = (input: string) => {
  return new RegExp(`^${input}$`, "i")
}

export const UsersRepository = () => {
  const findByIdIncludeRaw = async (
    userId: UserId,
  ): Promise<{ domainUser: User; raw: UserType } | RepositoryError> => {
    try {
      const result = await User.findOne({ _id: userId })
      if (!result) {
        return new CouldNotFindError()
      }
      return {
        domainUser: userFromRaw(result),
        raw: result,
      }
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const findById = async (userId: UserId): Promise<User | RepositoryError> => {
    try {
      const result = await User.findOne({ _id: userId })
      if (!result) {
        return new CouldNotFindError()
      }

      return userFromRaw(result)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const update = async ({
    id,
    username,
    phone,
    language,
    contacts,
    quizQuestions,
    defaultAccountId,
    deviceTokens,
  }: User): Promise<User | RepositoryError> => {
    try {
      const data = {
        username,
        phone,
        language,
        contacts: contacts.map(({ walletName, alias }: WalletContact) => ({
          id: walletName,
          name: alias,
        })),
        deviceToken: deviceTokens,
      }
      const doc = await User.updateOne({ _id: id }, { $set: data })
      if (doc.nModified !== 1) {
        return new RepositoryError("Couldn't update user")
      }
      return {
        id,
        username,
        phone,
        language,
        contacts,
        quizQuestions,
        defaultAccountId,
        deviceTokens,
      }
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  return {
    findByIdIncludeRaw,
    findById,
    update,
  }
}

const userFromRaw = (result: UserType): User => {
  return {
    id: result.id as UserId,
    username: (result.username as Username) || null,
    phone: result.phone as PhoneNumber,
    language: (result.language || UserLanguage.EN_US) as UserLanguage,
    contacts: result.contacts.reduce(
      (res: WalletContact[], contact: ConcatObjectForUser): WalletContact[] => {
        if (contact.id) {
          res.push({
            walletName: contact.id as WalletName,
            alias: (contact.name || contact.id) as ContactAlias,
            transactionsCount: contact.transactionsCount,
          })
        }
        return res
      },
      [],
    ),
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
    defaultAccountId: result.id as AccountId,
    deviceTokens: (result.deviceToken || []) as DeviceToken[],
  }
}
