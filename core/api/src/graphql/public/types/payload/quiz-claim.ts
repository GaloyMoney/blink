import IError from "../../../shared/types/abstract/error"
import Quiz from "../object/quiz"

import { GT } from "@/graphql/index"

const QuizClaimPayload = GT.Object({
  name: "QuizClaimPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    quizzes: {
      type: GT.List(Quiz),
    },
  }),
})

export default QuizClaimPayload
