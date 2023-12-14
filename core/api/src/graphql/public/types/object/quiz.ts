import SatAmount from "../../../shared/types/scalar/sat-amount"

import { GT } from "@/graphql/index"

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
