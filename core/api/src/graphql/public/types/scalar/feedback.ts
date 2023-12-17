import { MAX_LENGTH_FOR_FEEDBACK } from "@/config"
import { InputValidationError } from "@/graphql/error"
import { GT } from "@/graphql/index"

const Feedback = GT.Scalar({
  name: "Feedback",
  description: "Feedback shared with our user",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({ message: "Invalid type for Feedback" })
    }
    return validFeedback(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validFeedback(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for Feedback" })
  },
})

function validFeedback(value: string): Feedback | InputValidationError {
  if (value.length <= MAX_LENGTH_FOR_FEEDBACK) {
    return value as Feedback
  }
  return new InputValidationError({ message: "Feedback is too long" })
}

export default Feedback
