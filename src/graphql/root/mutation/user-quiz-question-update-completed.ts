import { Accounts } from "@app"
import { onboardingEarn } from "@config/app"
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

    try {
      const quizQuestions = await Accounts.addEarn({
        quizQuestionId: id,
        accountId: uid,
        logger,
      })
      const question = quizQuestions[0]

      return {
        errors: [],
        userQuizQuestion: {
          question: { id: question.id, earnAmount: question.value },
          completed: question.completed,
        },
      }
    } catch (err) {
      return {
        errors: [{ message: err.message || err.name }],
      }
    }
  },
})

export default UserQuizQuestionUpdateCompletedMutation
