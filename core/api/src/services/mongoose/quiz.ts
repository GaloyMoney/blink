import { Quiz } from "./schema"

import { QuizCompleted } from "@/domain/quiz"

import { QuizAlreadyPresentError, UnknownRepositoryError } from "@/domain/errors"
import { QuizQuestionId } from "@/domain/quiz/index.types"

interface ExtendedError extends Error {
  code?: number
}

export const QuizRepository = () => {
  const add = async ({
    quizId,
    accountId,
  }: {
    quizId: QuizQuestionId
    accountId: AccountId
  }) => {
    try {
      await Quiz.create({ accountId, quizId })

      return true
    } catch (err) {
      if (err instanceof Error) {
        const error = err as ExtendedError
        if (error?.code === 11000) return new QuizAlreadyPresentError()
      }

      return new UnknownRepositoryError(err)
    }
  }

  const fetchAll = async (
    accountId: AccountId,
  ): Promise<QuizCompleted[] | RepositoryError> => {
    try {
      const result = await Quiz.find({ accountId })
      return result.map(translateToQuiz)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  return {
    add,
    fetchAll,
  }
}

const translateToQuiz = (result: QuizCompletedRecord): QuizCompleted => ({
  quizId: result.quizId as QuizQuestionId,
  createdAt: new Date(result.createdAt),
})
