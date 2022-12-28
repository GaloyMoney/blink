import { GT } from "@graphql/index"
import { InputValidationError } from "@graphql/error"

const DisplayCurrency = GT.Scalar<string | InputValidationError>({
  name: "DisplayCurrency",
  description: "Display currency of an account",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({ message: "Invalid type for DisplayCurrency" })
    }
    return validDisplayCurrencyValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validDisplayCurrencyValue(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for Currency" })
  },
})

function validDisplayCurrencyValue(value: string): string | InputValidationError {
  if (!value || value.length < 3 || value.length > 4) {
    return new InputValidationError({ message: "Invalid value for DisplayCurrency" })
  }
  return value.toUpperCase()
}

export default DisplayCurrency
