import IError from "../../../shared/types/abstract/error"
import Quiz from "../object/quiz"

import { GT } from "@/graphql/index"

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
