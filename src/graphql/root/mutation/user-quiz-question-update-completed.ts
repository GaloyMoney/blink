import { Accounts } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import { GT } from "@graphql/index"

import UserQuizQuestionUpdateCompletedPayload from "@graphql/types/payload/user-quiz-question-update-completed"

const UserQuizQuestionUpdateCompletedInput = GT.Input({
  name: "UserQuizQuestionUpdateCompletedInput",
  fields: () => ({
    id: { type: GT.NonNull(GT.ID) },
  }),
})

const UserQuizQuestionUpdateCompletedMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(UserQuizQuestionUpdateCompletedPayload),
  args: {
    input: { type: GT.NonNull(UserQuizQuestionUpdateCompletedInput) },
  },
  resolve: async (_, args, { domainAccount }: { domainAccount: Account }) => {
    const { id } = args.input

    const question = await Accounts.addEarn({
      quizQuestionId: id,
      accountId: domainAccount.id,
    })
    if (question instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(question)] }
    }

    return {
      errors: [],
      userQuizQuestion: {
        question,
        completed: true,
      },
    }
  },
})

export default UserQuizQuestionUpdateCompletedMutation
