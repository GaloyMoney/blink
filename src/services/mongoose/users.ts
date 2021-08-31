import { UserLanguage } from "@domain/users"
import { toSats } from "@domain/bitcoin"
import {
  UnknownRepositoryError,
  CouldNotFindError,
  RepositoryError,
} from "@domain/errors"
import { User } from "@services/mongoose/schema"
import { onboardingEarn } from "@config/app"

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
        deviceToken: result.deviceToken || [],
        createdAt: result.created_at,
      }
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  return {
    findById,
  }
}
