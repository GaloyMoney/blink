import { GT } from "@graphql/index"
import { UserInputError } from "apollo-server-errors"

const LnPaymentRequest = new GT.Scalar({
  name: "LnPaymentRequest",
  description: "BOLT11 lightning invoice payment request with the amount included",
  parseValue(value) {
    return validLnPaymentRequest(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validLnPaymentRequest(ast.value)
    }
    return new UserInputError("Invalid type for LnPaymentRequest")
  },
})

function validLnPaymentRequest(value) {
  // TODO: verify/improve
  if (value.match(/^ln[a-z0-9]+$/i)) {
    return value
  }
  return new UserInputError("Invalid value for LnPaymentRequest")
}

export default LnPaymentRequest
