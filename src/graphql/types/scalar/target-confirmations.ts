import { GT } from "@graphql/index"
import { UserInputError } from "apollo-server-errors"

const TargetConfirmations = new GT.Scalar({
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
    return new UserInputError("Invalid type for TargetConfirmations")
  },
})

function validTargetConfirmations(value) {
  const intValue = Number.parseInt(value, 10)
  if (Number.isInteger(intValue) && intValue > 0) {
    return intValue
  }
  return new UserInputError("Invalid value for TargetConfirmations")
}

export default TargetConfirmations
