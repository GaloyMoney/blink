import { Accounts } from "@app"
import { onboardingEarn } from "@config/app"
import { mapError } from "@graphql/error-map"
import { GT } from "@graphql/index"

import UserQuizQuestionUpdateCompletedPayload from "@graphql/types/payload/user-quiz-question-update-completed"

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
  resolve: async (_, args, { uid, logger }) => {
    const { id } = args.input

    if (!onboardingEarn[id]) {
      return { errors: [{ message: "Invalid input" }] }
    }

    const question = await Accounts.addEarn({
      quizQuestionId: id,
      accountId: uid,
      logger,
    })
    if (question instanceof Error) {
      const appErr = mapError(question)
      return { errors: [{ message: appErr.message || appErr.name }] }
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
