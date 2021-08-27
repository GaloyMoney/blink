import { GT } from "@graphql/index"
import IError from "../abstract/error"

import UserQuizQuestion from "../object/user-quiz-question"

const UserQuizQuestionsUpdateCompletedPayload = new GT.Object({
  name: "UserQuizQuestionsUpdateCompletedPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    userQuizQuestions: {
      type: UserQuizQuestion,
    },
  }),
})

export default UserQuizQuestionsUpdateCompletedPayload
