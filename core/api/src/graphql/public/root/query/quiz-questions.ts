import { GT } from "@/graphql/index"

import QuizQuestion from "@/graphql/public/types/object/quiz-question"
import { OnboardingEarn } from "@/config"

const QuizQuestionsQuery = GT.Field({
  deprecationReason:
    "TODO: remove. we don't need a non authenticated version of this query. the users can only do the query while authenticated",
  type: GT.List(QuizQuestion),
  resolve: async () => {
    return Object.entries(OnboardingEarn).map(([id, earnAmount]) => ({
      id,
      earnAmount,
    }))
  },
})

export default QuizQuestionsQuery
