import { InputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"

const MAX_LENGTH = 500

const Prompt = GT.Scalar({
  name: "Prompt",
  description: "A prompt to get an answer from the ChatBot",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({ message: "Invalid type for Prompt" })
    }
    return validPrompt(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validPrompt(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for Prompt" })
  },
})

function validPrompt(value: string) {
  if (value.length > MAX_LENGTH || value.length === 0) {
    return new InputValidationError({ message: "Invalid length for Prompt" })
  }
  return value
}

export default Prompt
