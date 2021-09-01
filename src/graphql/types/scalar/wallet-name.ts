import { GT } from "@graphql/index"
import { UserInputError } from "apollo-server-errors"

const WalletName = new GT.Scalar({
  name: "WalletName",
  description: "Unique identifier of an account wallet",
  parseValue(value) {
    return validWalletNameValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validWalletNameValue(ast.value)
    }
    return new UserInputError("Invalid type for WalletName")
  },
})

function validWalletNameValue(value) {
  if (value.match(/^[a-z0-9_]{3,50}/i)) {
    return value.toLowerCase()
  }
  return new UserInputError("Invalid value for WalletName")
}

export default WalletName
