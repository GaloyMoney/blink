import { InputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"

const TargetConfirmations = GT.Scalar({
  name: "TargetConfirmations",
  description:
    "(Positive) Number of blocks in which the transaction is expected to be confirmed",
  parseValue(value) {
    if (typeof value !== "string" && typeof value !== "number") {
      return new InputValidationError({ message: "Invalid type for TargetConfirmations" })
    }
    return validTargetConfirmations(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.INT) {
      return validTargetConfirmations(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for TargetConfirmations" })
  },
})

function validTargetConfirmations(value: string | number): number | InputValidationError {
  const valueAsString = value + ""
  const intValue = Number.parseInt(valueAsString, 10)
  return intValue
}

export default TargetConfirmations
