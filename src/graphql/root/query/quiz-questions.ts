import { GT } from "@graphql/index"

import QuizQuestion from "@graphql/types/object/quiz-question"
import { onboardingEarn } from "@config"

const QuizQuestionsQuery = GT.Field({
  type: GT.List(QuizQuestion),
  resolve: async () => {
    return Object.entries(onboardingEarn).map(([id, earnAmount]) => ({
      id,
      earnAmount,
    }))
  },
})

export default QuizQuestionsQuery
