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
  // Regex patterns: https://regexland.com/regex-bitcoin-addresses/
  const regexes = [
    /^[13]{1}[a-km-zA-HJ-NP-Z1-9]{26,34}$/, // mainnet non-segwit
    /^bc1[a-z0-9]{39,59}$/i, // mainnet segwit
    /^[mn2]{1}[a-km-zA-HJ-NP-Z1-9]{26,34}$/, // testnet non-segwit
    /^tb1[a-z0-9]{39,59}$/i, // testnet segwit
  ]

  return regexes.some((r) => value.match(r))
    ? value
    : new UserInputError("Invalid value for OnChainAddress")
}

export default OnChainAddress
