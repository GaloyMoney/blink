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
  // TODO: verify/improve
  if (value.match(/^[A-Fa-f0-9]{64}$/)) {
    return value
  }
  return new UserInputError("Invalid value for LnPaymentPreImage")
}

export default LnPaymentPreImage
