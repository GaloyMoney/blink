import { isSha256Hash } from "@domain/bitcoin"
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
  return isSha256Hash(value) ? value : new UserInputError("Invalid value for PaymentHash")
}

export default PaymentHash
