import { GT } from "@graphql/index"
import { UserInputError } from "apollo-server-errors"

const OnChainTxHash = new GT.Scalar({
  name: "OnChainTxHash",
  parseValue(value) {
    return validOnChainTxHash(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validOnChainTxHash(ast.value)
    }
    return new UserInputError("Invalid type for OnChainTxHash")
  },
})

function validOnChainTxHash(value) {
  // TODO: verify/improve
  if (value.match(/^[a-f0-9]{64}$/i)) {
    return value
  }
  return new UserInputError("Invaild value for OnChainTxHash")
}

export default OnChainTxHash
