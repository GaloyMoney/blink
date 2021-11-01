import { UserLanguage } from "@domain/users"
import { toSats } from "@domain/bitcoin"
import {
  UnknownRepositoryError,
  RepositoryError,
  CouldNotFindUserFromIdError,
  CouldNotFindUserFromUsernameError,
  CouldNotFindUserFromWalletIdError,
} from "@domain/errors"
import { User } from "@services/mongoose/schema"
import { onboardingEarn } from "@config/app"
import Username from "@graphql/types/scalar/username"

export const caseInsensitiveRegex = (input: string) => {
  return new RegExp(`^${input}$`, "i")
}

export const UsersRepository = (): IUsersRepository => {
  const findById = async (userId: UserId): Promise<User | RepositoryError> => {
    try {
      const result = await User.findOne({ _id: userId })
      if (!result) {
        return new CouldNotFindUserFromIdError(userId)
      }

      return userFromRaw(result)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const findByUsername = async (username: Username): Promise<User | RepositoryError> => {
    try {
      const result = await User.findOne({ username: caseInsensitiveRegex(username) })
      if (!result) {
        return new CouldNotFindUserFromUsernameError(username)
      }

      return userFromRaw(result)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const findByWalletPublicId = async (
    walletPublicId: WalletPublicId,
  ): Promise<User | RepositoryError> => {
    try {
      const result = await User.findOne({ walletPublicId })
      if (!result) {
        return new CouldNotFindUserFromWalletIdError(walletPublicId)
      }

      return userFromRaw(result)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const update = async ({
    id,
    phone,
    language,
    contacts,
    deviceTokens,
    lastConnection,
    twoFA,
  }: User): Promise<User | RepositoryError> => {
    try {
      const data = {
        phone,
        language,
        contacts: contacts.map(({ username, alias, transactionsCount }: UserContact) => ({
          id: username,
          name: alias,
          transactionsCount,
        })),
        deviceToken: deviceTokens,
        lastConnection,
        twoFA,
      }
      const result = await User.findOneAndUpdate({ _id: id }, data)
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
    findByUsername,
    findByWalletPublicId,
    update,
  }
}

const userFromRaw = (result: UserType): User => {
  return {
    id: result.id as UserId,
    username: result.username as Username,
    walletPublicId: result.walletPublicId as WalletPublicId,
    phone: result.phone as PhoneNumber,
    language: result.language as UserLanguage,
    twoFA: result.twoFA as TwoFAForUser,
    contacts: result.contacts.reduce(
      (res: UserContact[], contact: ContactObjectForUser): UserContact[] => {
        if (contact.id) {
          res.push({
            username: contact.id as Username,
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
    lastConnection: result.lastConnection,
    lastIPs: (result.lastIPs || []) as IPType[],
    createdAt: new Date(result.created_at),
  }
}
