import { checkedToTargetConfs } from "@domain/bitcoin"
import { InputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"

const TargetConfirmations = GT.Scalar({
  name: "TargetConfirmations",
  description:
    "(Positive) Number of blocks in which the transaction is expected to be confirmed",
  parseValue(value) {
    if (typeof value !== "string") {
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

function validTargetConfirmations(
  value: string,
): TargetConfirmations | InputValidationError {
  const intValue = Number.parseInt(value, 10)
  const targetConfValid = checkedToTargetConfs(intValue)
  if (targetConfValid instanceof Error) {
    return new InputValidationError({ message: "Invalid value for TargetConfirmations" })
  }
  return targetConfValid
}

export default TargetConfirmations
