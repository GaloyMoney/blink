import { BTC_NETWORK } from "@config"
import { checkedToOnChainAddress } from "@domain/bitcoin/onchain"
import { InputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"

const OnChainAddress = GT.Scalar({
  name: "OnChainAddress",
  description: "An address for an on-chain bitcoin destination",
  parseValue(value) {
    return validOnChainAddressValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validOnChainAddressValue(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for OnChainAddress" })
  },
})

function validOnChainAddressValue(value) {
  const address = checkedToOnChainAddress({ network: BTC_NETWORK, value })
  if (address instanceof Error)
    return new InputValidationError({ message: "Invalid value for OnChainAddress" })
  return address
}

export default OnChainAddress
