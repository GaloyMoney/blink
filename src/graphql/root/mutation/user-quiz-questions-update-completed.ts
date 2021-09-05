import { onboardingEarn } from "@config/app"
import { GT } from "@graphql/index"

import UserQuizQuestionsUpdateCompletedPayload from "@graphql/types/payload/user-quiz-questions-update-completed"

const UserQuizQuestionsUpdateCompletedInput = new GT.Input({
  name: "UserQuizQuestionsUpdateCompletedInput",
  fields: () => ({
    ids: { type: GT.NonNullList(GT.ID) }, // TODO: ENUM?
  }),
})

const UserQuizQuestionsUpdateCompletedMutation = GT.Field({
  type: GT.NonNull(UserQuizQuestionsUpdateCompletedPayload),
  args: {
    input: { type: GT.NonNull(UserQuizQuestionsUpdateCompletedInput) },
  },
  resolve: async (_, args, { wallet }) => {
    const { ids } = args.input

    // TODO: Figure out a better protection for this mutation
    if (ids.length > 3) {
      return { errors: [{ message: "Invalid requset" }] }
    }

    if (ids.some((id) => !onboardingEarn[id])) {
      return { errors: [{ message: "Invalid input" }] }
    }

    try {
      const quizQuestions = await wallet.addEarn(ids)

      return {
        errors: [],
        userQuizQuestions: quizQuestions.map((question) => {
          return {
            question: { id: question.id, earnAmount: question.value },
            completed: question.completed,
          }
        }),
      }
    } catch (err) {
      return {
        errors: [{ message: err.message || err.name }],
      }
    }
  },
})

export default UserQuizQuestionsUpdateCompletedMutation
