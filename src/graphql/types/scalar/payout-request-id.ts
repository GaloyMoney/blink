import crypto from "crypto"

import { checkedToPayoutRequestId } from "@domain/bitcoin"
import { InputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"

const PayoutRequestId = GT.Scalar<PayoutRequestId | InputValidationError>({
  name: "PayoutRequestId",
  description: "Unique request id for a payout",
  parseValue(value) {
    if (value === null) {
      return validPayoutRequestIdValue(crypto.randomUUID())
    }

    if (typeof value !== "string") {
      return new InputValidationError({ message: "Invalid type for PayoutRequestId" })
    }
    return validPayoutRequestIdValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validPayoutRequestIdValue(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for PayoutRequestId" })
  },
})

function validPayoutRequestIdValue(
  value: string,
): PayoutRequestId | InputValidationError {
  const checkedPayoutRequestId = checkedToPayoutRequestId(value)
  if (checkedPayoutRequestId instanceof Error) {
    return new InputValidationError({ message: "Invalid value for PayoutRequestId" })
  }
  return checkedPayoutRequestId
}

export default PayoutRequestId
