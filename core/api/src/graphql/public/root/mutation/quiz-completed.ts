import { GT } from "@/graphql/index"

import QuizCompleted from "@/graphql/public/types/payload/quiz-completed"

const QuizCompletedInput = GT.Input({
  name: "QuizCompletedInput",
  fields: () => ({
    id: { type: GT.NonNull(GT.ID) },
  }),
})

// TODO: remove endpoint after 06/2024
const QuizCompletedMutation = GT.Field<
  null,
  GraphQLPublicContextAuth,
  { input: { id: string } }
>({
  extensions: {
    complexity: 120,
  },
  deprecationReason: "Use quizClaim instead",
  type: GT.NonNull(QuizCompleted),
  args: {
    input: { type: GT.NonNull(QuizCompletedInput) },
  },
  resolve: async () => {
    return {
      errors: [
        {
          message: "update the application to the latest version to use this feature",
          path: "update the application to the latest version to use this feature",
          code: "update the application to the latest version to use this feature",
        },
      ],
    }
  },
})

export default QuizCompletedMutation
