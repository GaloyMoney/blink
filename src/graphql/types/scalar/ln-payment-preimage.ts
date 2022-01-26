import { isSha256Hash } from "@domain/bitcoin"
import { InputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"

const LnPaymentPreImage = GT.Scalar({
  name: "LnPaymentPreImage",
  parseValue(value) {
    return validLnPaymentPreImage(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validLnPaymentPreImage(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for LnPaymentPreImage" })
  },
})

function validLnPaymentPreImage(value) {
  return isSha256Hash(value)
    ? value
    : new InputValidationError({ message: "Invalid value for LnPaymentPreImage" })
}

export default LnPaymentPreImage
