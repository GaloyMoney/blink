import { QuizRepository } from "../mongoose"

import { QuizzesValue } from "@/app/quiz/config"

export const getQuizzesByAccountId = async (accountId: AccountId) => {
  const quizzes = await QuizRepository(accountId).fetchAll()
  if (quizzes instanceof Error) return quizzes

  const solvedQuizId = quizzes.map((quiz) => quiz.quizId)

  const result = Object.entries(QuizzesValue).map(([id, amount]) => ({
    id: id as QuizQuestionId,
    amount,
    completed: solvedQuizId.indexOf(id) > -1,
  }))

  return result
}
