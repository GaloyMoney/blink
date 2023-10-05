import QuizQuestion from "./quiz-question"

import { GT } from "@/graphql/index"

// deprecated // TODO: remove
const UserQuizQuestion = GT.Object({
  name: "UserQuizQuestion",
  fields: () => ({
    question: { type: GT.NonNull(QuizQuestion) },
    completed: { type: GT.NonNull(GT.Boolean) },
  }),
})

export default UserQuizQuestion
