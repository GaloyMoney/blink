import { Quiz } from "@/app"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import { GT } from "@/graphql/index"

import QuizClaim from "@/graphql/public/types/payload/quiz-claim"

const QuizClaimInput = GT.Input({
  name: "QuizClaimInput",
  fields: () => ({
    id: { type: GT.NonNull(GT.ID) },
  }),
})

const QuizClaimMutation = GT.Field<
  null,
  GraphQLPublicContextAuth,
  { input: { id: string } }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(QuizClaim),
  args: {
    input: { type: GT.NonNull(QuizClaimInput) },
  },
  resolve: async (_, args, { domainAccount, ip }) => {
    const { id } = args.input

    const quizzes = await Quiz.claimQuiz({
      quizQuestionId: id,
      accountId: domainAccount.id,
      ip,
      legacy: false,
    })
    if (quizzes instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(quizzes)] }
    }

    return {
      errors: [],
      quizzes,
    }
  },
})

export default QuizClaimMutation
