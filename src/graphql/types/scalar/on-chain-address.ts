import { BTC_NETWORK } from "@config"
import { checkedToOnChainAddress } from "@domain/bitcoin/onchain"
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
  const address = checkedToOnChainAddress({ network: BTC_NETWORK, value })
  if (address instanceof Error)
    return new UserInputError("Invalid value for OnChainAddress")
  return address
}

export default OnChainAddress
