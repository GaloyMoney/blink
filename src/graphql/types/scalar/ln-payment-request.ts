import { InputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"

const LnPaymentRequest = GT.Scalar({
  name: "LnPaymentRequest",
  description: "BOLT11 lightning invoice payment request with the amount included",
  parseValue(value) {
    return validLnPaymentRequest(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validLnPaymentRequest(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for LnPaymentRequest" })
  },
})

function validLnPaymentRequest(value) {
  // TODO: verify/improve
  if (value.match(/^ln[a-z0-9]+$/i)) {
    return value
  }
  return new InputValidationError({ message: "Invalid value for LnPaymentRequest" })
}

export default LnPaymentRequest
