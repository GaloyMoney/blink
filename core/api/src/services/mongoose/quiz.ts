import { Quiz } from "./schema"

import { QuizAlreadyPresentError, UnknownRepositoryError } from "@/domain/errors"

interface ExtendedError extends Error {
  code?: number
}

export const QuizRepository = (accountId: AccountId) => {
  const add = async (quizId: QuizQuestionId) => {
    try {
      await Quiz.create({ accountId, quizId })

      return true
    } catch (err) {
      if (err instanceof Error) {
        const error = err as ExtendedError
        if (error?.code === 11000) return new QuizAlreadyPresentError()
      }

      return new UnknownRepositoryError("quiz issue")
    }
  }

  const fetchAll = async () => {
    try {
      const result = await Quiz.find({ accountId })
      return result
    } catch (err) {
      return new UnknownRepositoryError("quiz issue")
    }
  }

  return {
    add,
    fetchAll,
  }
}
