type QuizQuestionId =
  typeof import("./index").QuizQuestionIds[keyof typeof import("./index").QuizQuestionIds]

type QuizData = {
  amount: Satoshis
  needs: { id: QuizQuestionId; minInterval: Seconds } | undefined
}

type QuizQuestion = {
  readonly id: QuizQuestionId
  readonly earnAmount: Satoshis
}

type UserQuizQuestion = {
  readonly question: QuizQuestion
  completed: boolean
}
