import { isSha256Hash } from "@domain/bitcoin"
import { InputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"

const OnChainTxHash = GT.Scalar({
  name: "OnChainTxHash",
  parseValue(value) {
    return validOnChainTxHash(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validOnChainTxHash(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for OnChainTxHash" })
  },
})

function validOnChainTxHash(value) {
  return isSha256Hash(value)
    ? value
    : new InputValidationError({ message: "Invalid value for OnChainTxHash" })
}

export default OnChainTxHash
