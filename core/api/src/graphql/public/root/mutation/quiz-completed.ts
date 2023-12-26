import { Quiz } from "@/app"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import { GT } from "@/graphql/index"

import QuizCompleted from "@/graphql/public/types/payload/quiz-completed"

const QuizCompletedInput = GT.Input({
  name: "QuizCompletedInput",
  fields: () => ({
    id: { type: GT.NonNull(GT.ID) },
  }),
})

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
  resolve: async (_, args, { domainAccount, ip }) => {
    const { id } = args.input

    const quizzes = await Quiz.claimQuizLegacy({
      quizQuestionId: id,
      accountId: domainAccount.id,
      ip,
    })
    if (quizzes instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(quizzes)] }
    }

    return {
      errors: [],
      quiz: quizzes.find((q) => q.id === id),
    }
  },
})

export default QuizCompletedMutation
