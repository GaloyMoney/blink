import { GT } from "@graphql/index"

import AppError from "../object/app-error"
import UserQuizQuestion from "../object/user-quiz-question"

const UserQuizQuestionUpdateCompletedPayload = GT.Object({
  name: "UserQuizQuestionUpdateCompletedPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(AppError),
    },
    userQuizQuestion: {
      type: UserQuizQuestion,
    },
  }),
})

export default UserQuizQuestionUpdateCompletedPayload
