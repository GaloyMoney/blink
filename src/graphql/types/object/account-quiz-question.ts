import { GT } from "@graphql/index"

import SatAmount from "../scalar/sat-amount"

const AccountQuiz = GT.Object({
  name: "AccountQuiz",
  fields: () => ({
    id: { type: GT.NonNullID },
    amount: {
      type: GT.NonNull(SatAmount),
      description: "The reward in Satoshis for the quiz question",
    },
    completed: { type: GT.NonNull(GT.Boolean) },
  }),
})

export default AccountQuiz
