import { Payments } from "@/app"
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

    const res = await Payments.addEarn({
      quizQuestionId: id,
      accountId: domainAccount.id,
    })
    if (res instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(res)] }
    }

    return {
      errors: res.rewardPaymentError
        ? [mapAndParseErrorForGqlResponse(res.rewardPaymentError)]
        : [],
      quiz: res.quizQuestion,
    }
  },
})

export default QuizCompletedMutation
