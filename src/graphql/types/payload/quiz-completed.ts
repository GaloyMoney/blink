import { GT } from "@graphql/index"

import IError from "../abstract/error"
import Quiz from "../object/quiz"

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
