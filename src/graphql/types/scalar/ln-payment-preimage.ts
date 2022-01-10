import { isSha256Hash } from "@domain/bitcoin"
import { GT } from "@graphql/index"
import { UserInputError } from "apollo-server-errors"

const LnPaymentPreImage = new GT.Scalar({
  name: "LnPaymentPreImage",
  parseValue(value) {
    return validLnPaymentPreImage(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validLnPaymentPreImage(ast.value)
    }
    return new UserInputError("Invalid type for LnPaymentPreImage")
  },
})

function validLnPaymentPreImage(value) {
  return isSha256Hash(value)
    ? value
    : new UserInputError("Invalid value for LnPaymentPreImage")
}

export default LnPaymentPreImage
