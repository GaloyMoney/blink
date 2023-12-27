import { fillQuizInformation } from "@/domain/quiz"
import { QuizRepository } from "@/services/mongoose"

export const listQuizzesByAccountId = async (accountId: AccountId) => {
  const quizzes = await QuizRepository().fetchAll(accountId)
  if (quizzes instanceof Error) return quizzes

  return fillQuizInformation(quizzes).quizzes
}
