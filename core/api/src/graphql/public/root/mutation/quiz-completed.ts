import { Payments } from "@/app"
import { PartialResultType } from "@/app/partial-result"
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
  type: GT.NonNull(QuizCompleted),
  args: {
    input: { type: GT.NonNull(QuizCompletedInput) },
  },
  resolve: async (_, args, { domainAccount }) => {
    const { id } = args.input

    const { result, error, type } = await Payments.addEarn({
      quizQuestionId: id,
      accountId: domainAccount.id,
    })

    if (type === PartialResultType.Err) {
      return { errors: [mapAndParseErrorForGqlResponse(error)] }
    }

    return {
      errors: error ? [mapAndParseErrorForGqlResponse(error)] : [],
      quiz: result.quiz,
      rewardPaid: result.rewardPaid,
    }
  },
})

export default QuizCompletedMutation
