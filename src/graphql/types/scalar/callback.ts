import { checkedToUrl } from "@domain/shared"
import { InputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"

const Callback = GT.Scalar({
  name: "Callback",
  description: "Callback URL to report lightning invoice updates",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({ message: "Invalid type for Callback" })
    }
    return validCallbackValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validCallbackValue(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for Callback" })
  },
})

function validCallbackValue(value: string) {
  const urlValid = checkedToUrl(value)
  if (urlValid instanceof Error)
    return new InputValidationError({ message: "Invalid value for Callback" })
  return urlValid
}

export default Callback
