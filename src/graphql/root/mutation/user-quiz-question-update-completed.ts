import { Accounts } from "@app"
import { mapError } from "@graphql/error-map"
import { GT } from "@graphql/index"

import UserQuizQuestionUpdateCompletedPayload from "@graphql/types/payload/user-quiz-question-update-completed"

const UserQuizQuestionUpdateCompletedInput = GT.Input({
  name: "UserQuizQuestionUpdateCompletedInput",
  fields: () => ({
    id: { type: GT.NonNull(GT.ID) },
  }),
})

const UserQuizQuestionUpdateCompletedMutation = GT.Field({
  type: GT.NonNull(UserQuizQuestionUpdateCompletedPayload),
  args: {
    input: { type: GT.NonNull(UserQuizQuestionUpdateCompletedInput) },
  },
  resolve: async (
    _,
    args,
    { domainAccount, logger }: { domainAccount: Account; logger: Logger },
  ) => {
    const { id } = args.input

    const question = await Accounts.addEarn({
      quizQuestionId: id,
      accountId: domainAccount.id,
      logger,
    })
    if (question instanceof Error) {
      const appErr = mapError(question)
      return { errors: [{ message: appErr.message }] }
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
