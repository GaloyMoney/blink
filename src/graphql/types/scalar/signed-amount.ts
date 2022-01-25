import { InputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"

const SignedAmount = GT.Scalar({
  name: "SignedAmount",
  description: "An amount (of a currency) that can be negative (i.g. in a transaction)",
  parseValue(value) {
    return validSignedAmount(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.INT) {
      return validSignedAmount(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for SignedAmount" })
  },
})

function validSignedAmount(value) {
  if (Number.isInteger(value)) {
    return value
  }
  return new InputValidationError({ message: "Invalid value for SignedAmount" })
}

export default SignedAmount
