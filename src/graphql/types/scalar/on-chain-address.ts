import { GT } from "@graphql/index"
import { UserInputError } from "apollo-server-errors"

const OnChainAddress = new GT.Scalar({
  name: "OnChainAddress",
  description: "An address for an on-chain bitcoin destination",
  parseValue(value) {
    return validOnChainAddressValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validOnChainAddressValue(ast.value)
    }
    return new UserInputError("Invalid type for OnChainAddress")
  },
})

function validOnChainAddressValue(value) {
  // TODO: verify/improve. Use bc1/tb1 prefixes?
  if (value.match(/^[A-Z0-9]+$/i)) {
    return value.toLowerCase()
  }
  return new UserInputError("Invalid value for OnChainAddress")
}

export default OnChainAddress
