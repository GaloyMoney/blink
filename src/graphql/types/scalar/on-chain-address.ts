import { GT } from "@graphql/index"

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
    return new Error("Invalid type for OnChainAddress")
  },
})

function validOnChainAddressValue(value) {
  // TODO: verify/improve. Use bc1/tb1 prefixes?
  if (value.match(/^[A-Fa-f0-9]+$/i)) {
    return value.toLowerCase()
  }
  return new Error("Invalid value for OnChainAddress")
}

export default OnChainAddress
