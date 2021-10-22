import { updateUserQuizQuestionCompleted } from "@app/lightning/user-quiz-question"
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
  resolve: async (_, args, { user, logger }) => {
    const { id } = args.input
    for (const input of [id]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    if (!onboardingEarn[id]) {
      return { errors: [{ message: "Invalid input" }] }
    }

    const userQuizQuestion = await updateUserQuizQuestionCompleted({
      questionId: id as QuizQuestionId,
      userId: user.id as UserId,
      logger,
    })
    if (userQuizQuestion instanceof Error) {
      const appErr = mapError(userQuizQuestion)
      return { errors: [{ message: appErr.message }] }
    }

    return {
      errors: [],
      userQuizQuestion,
    }
  },
})

export default UserQuizQuestionUpdateCompletedMutation
