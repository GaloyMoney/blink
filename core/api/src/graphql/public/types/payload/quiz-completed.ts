import Quiz from "../object/quiz"

import IError from "@/graphql/shared/types/abstract/error"
import { GT } from "@/graphql/index"

// deprecated
const QuizCompletedPayload = GT.Object({
  name: "QuizCompletedPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    quiz: {
      type: Quiz,
    },
  }),
})

export default QuizCompletedPayload
