import { isSha256Hash } from "@domain/bitcoin"
import { InputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"

const FeeReimbursementHash = GT.Scalar({
  name: "FeeReimbursementHash",
  description: "A LN hash used for fee reimbursement",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({
        message: "Invalid type for FeeReimbursementHash",
      })
    }
    return validFeeReimbursementHashValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validFeeReimbursementHashValue(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for FeeReimbursementHash" })
  },
})

function validFeeReimbursementHashValue(value: string) {
  return isSha256Hash(value)
    ? value
    : new InputValidationError({ message: "Invalid value for FeeReimbursementHash" })
}

export default FeeReimbursementHash
