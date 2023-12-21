import { QuizzesValue } from "@/domain/earn/config"
import { QuizRepository } from "@/services/mongoose"

export const getQuizzesByAccountId = async (accountId: AccountId) => {
  const quizzes = await QuizRepository().fetchAll(accountId)
  if (quizzes instanceof Error) return quizzes

  const solvedQuizId = quizzes.map((quiz) => quiz.quizId)

  const result = Object.entries(QuizzesValue).map(([id, amount]) => ({
    id: id as QuizQuestionId,
    amount,
    completed: solvedQuizId.indexOf(id) > -1,
  }))

  return result
}
