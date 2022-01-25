import { InputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"

const TargetConfirmations = GT.Scalar({
  name: "TargetConfirmations",
  description:
    "(Positive) Number of blocks in which the transaction is expected to be confirmed",
  parseValue(value) {
    return validTargetConfirmations(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.INT) {
      return validTargetConfirmations(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for TargetConfirmations" })
  },
})

function validTargetConfirmations(value) {
  const intValue = Number.parseInt(value, 10)
  if (Number.isInteger(intValue) && intValue > 0) {
    return intValue
  }
  return new InputValidationError({ message: "Invalid value for TargetConfirmations" })
}

export default TargetConfirmations
