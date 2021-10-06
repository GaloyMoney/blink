import { GT } from "@graphql/index"
import { UserInputError } from "apollo-server-errors"

const PaymentHash = new GT.Scalar({
  name: "PaymentHash",
  parseValue(value) {
    return validPaymentHash(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validPaymentHash(ast.value)
    }
    return new UserInputError("Invalid type for PaymentHash")
  },
})

function validPaymentHash(value) {
  // TODO: verify/improve
  if (value.match(/^[a-f0-9]{64}$/i)) {
    return value
  }
  return new UserInputError("Invaild value for PaymentHash")
}

export default PaymentHash
