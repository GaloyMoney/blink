import { GT } from "@graphql/index"

import UserQuizQuestionsUpdateCompletedPayload from "@graphql/types/payload/user-quiz-questions-update-completed"
import Memo from "@graphql/types/scalar/memo"
import { addInvoice } from "@app/wallets/add-invoice-for-wallet"
import SatAmount from "@graphql/types/scalar/sat-amount"

const UserQuizQuestionsUpdateCompletedInput = new GT.Input({
  name: "UserQuizQuestionsUpdateCompletedInput",
  fields: () => ({
    ids: { type: GT.NonNullList(GT.ID) },
  }),
})

const UserQuizQuestionsUpdateCompletedMutation = GT.Field({
  type: GT.NonNull(UserQuizQuestionsUpdateCompletedPayload),
  args: {
    input: { type: GT.NonNull(UserQuizQuestionsUpdateCompletedInput) },
  },
  resolve: async (_, args, { wallet }) => {
    const { ids } = args.input
    try {
      const quizQuestions = await wallet.addEarn(ids)

      return {
        errors: [],
        userQuizQuestions: quizQuestions.map((question) => { return {question: {id: question.id, amount: question.value}, completed: question.completed }})
      }
    } catch (err) {
      return { 
        errors: [{ message: err.message }]
      }
    }
  },
})

export default UserQuizQuestionsUpdateCompletedMutation
