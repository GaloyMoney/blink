import { isSha256Hash } from "@domain/bitcoin"
import { GT } from "@graphql/index"
import { UserInputError } from "apollo-server-errors"

const LnPaymentSecret = new GT.Scalar({
  name: "LnPaymentSecret",
  parseValue(value) {
    return validLnPaymentSecret(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validLnPaymentSecret(ast.value)
    }
    return new UserInputError("Invalid type for LnPaymentSecret")
  },
})

function validLnPaymentSecret(value) {
  return isSha256Hash(value)
    ? value
    : new UserInputError("Invalid value for LnPaymentSecret")
}

export default LnPaymentSecret
