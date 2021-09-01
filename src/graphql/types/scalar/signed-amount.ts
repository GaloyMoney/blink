import { GT } from "@graphql/index"
import { UserInputError } from "apollo-server-errors"

const SignedAmount = new GT.Scalar({
  name: "SignedAmount",
  description: "An amount (of a currency) that can be negative (i.g. in a transaction)",
  parseValue(value) {
    return validSignedAmount(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.INT) {
      return validSignedAmount(ast.value)
    }
    return new UserInputError("Invalid type for SignedAmount")
  },
})

function validSignedAmount(value) {
  if (Number.isInteger(value)) {
    return value
  }
  return new UserInputError("Invalid value for SignedAmount")
}

export default SignedAmount
