import { GT } from "@graphql/index"

import SatAmount from "../scalar/sat-amount"

// deprecated // TODO: remove
const QuizQuestion = GT.Object({
  name: "QuizQuestion",
  fields: () => ({
    id: { type: GT.NonNullID },
    earnAmount: {
      type: GT.NonNull(SatAmount),
      description: "The earn reward in Satoshis for the quiz question",
    },
  }),
})

export default QuizQuestion
