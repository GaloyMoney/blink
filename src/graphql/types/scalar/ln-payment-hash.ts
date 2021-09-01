import { GT } from "@graphql/index"
import { UserInputError } from "apollo-server-errors"

const LnPaymentHash = new GT.Scalar({
  name: "LnPaymentHash",
  parseValue(value) {
    return validLnPaymentHash(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validLnPaymentHash(ast.value)
    }
    return new UserInputError("Invalid type for LnPaymentHash")
  },
})

function validLnPaymentHash(value) {
  // TODO: verify/improve
  if (value.match(/^[a-f0-9]{64}$/i)) {
    return value
  }
  return new UserInputError("Invaild value for LnPaymentHash")
}

export default LnPaymentHash
