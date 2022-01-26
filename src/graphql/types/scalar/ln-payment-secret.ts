import { isSha256Hash } from "@domain/bitcoin"
import { InputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"

const LnPaymentSecret = GT.Scalar({
  name: "LnPaymentSecret",
  parseValue(value) {
    return validLnPaymentSecret(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validLnPaymentSecret(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for LnPaymentSecret" })
  },
})

function validLnPaymentSecret(value) {
  return isSha256Hash(value)
    ? value
    : new InputValidationError({ message: "Invalid value for LnPaymentSecret" })
}

export default LnPaymentSecret
