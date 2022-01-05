import { Accounts } from "@app"
import { mapError } from "@graphql/error-map"
import { GT } from "@graphql/index"

import UserQuizQuestionUpdateCompletedPayload from "@graphql/types/payload/user-quiz-question-update-completed"
import {
  addAttributesToCurrentSpanAndPropagate,
  SemanticAttributes,
  ENDUSER_ALIAS,
} from "@services/tracing"

const UserQuizQuestionUpdateCompletedInput = new GT.Input({
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
    {
      domainUser,
      domainAccount,
      logger,
    }: { domainUser: User; domainAccount: Account; logger: Logger },
  ) =>
    addAttributesToCurrentSpanAndPropagate(
      {
        [SemanticAttributes.ENDUSER_ID]: domainUser.id,
        [ENDUSER_ALIAS]: domainAccount.username,
      },
      async () => {
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
    ),
})

export default UserQuizQuestionUpdateCompletedMutation
