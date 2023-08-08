import { GT } from "@graphql/index"

import SatAmount from "../../../shared/types/scalar/sat-amount"

const Quiz = GT.Object({
  name: "Quiz",
  fields: () => ({
    id: { type: GT.NonNullID },
    amount: {
      type: GT.NonNull(SatAmount),
      description: "The reward in Satoshis for the quiz question",
    },
    completed: { type: GT.NonNull(GT.Boolean) },
  }),
})

export default Quiz
