import { onboardingEarn } from "@domain/earn"
import { GT } from "@graphql/index"

import QuizQuestion from "@graphql/types/object/quiz-question"

const QuizQuestionsQuery = GT.Field({
  type: GT.List(QuizQuestion),
  resolve: async () => {
    return Object.entries(onboardingEarn).map(([id, { amount }]) => ({
      id,
      earnAmount: amount,
    }))
  },
})

export default QuizQuestionsQuery
