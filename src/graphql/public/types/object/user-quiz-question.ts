import { GT } from "@graphql/index"

import QuizQuestion from "./quiz-question"

// deprecated // TODO: remove
const UserQuizQuestion = GT.Object({
  name: "UserQuizQuestion",
  fields: () => ({
    question: { type: GT.NonNull(QuizQuestion) },
    completed: { type: GT.NonNull(GT.Boolean) },
  }),
})

export default UserQuizQuestion
