import { Earn } from "@/app"
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
  resolve: async (_, args, { domainAccount, ip }) => {
    const { id } = args.input

    const question = await Earn.addEarn({
      quizQuestionId: id,
      accountId: domainAccount.id,
      ip,
    })
    if (question instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(question)] }
    }

    return {
      errors: [],
      quiz: {
        id: question.id,
        amount: question.earnAmount,
        completed: true,
      },
    }
  },
})

export default QuizCompletedMutation
