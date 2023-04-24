import { InputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"

const Answer = GT.Scalar({
  name: "Answer",
  description: "An answer to a prompt from the ChatBot",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({ message: "Invalid type for Answer" })
    }
    return value
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return ast.value
    }
    return new InputValidationError({ message: "Invalid type for Answer" })
  },
})

export default Answer
