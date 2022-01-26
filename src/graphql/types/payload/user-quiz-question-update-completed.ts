import { GT } from "@graphql/index"

import IError from "../abstract/error"
import UserQuizQuestion from "../object/user-quiz-question"

const UserQuizQuestionUpdateCompletedPayload = GT.Object({
  name: "UserQuizQuestionUpdateCompletedPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    userQuizQuestion: {
      type: UserQuizQuestion,
    },
  }),
})

export default UserQuizQuestionUpdateCompletedPayload
