import { checkedToWalletPublicId } from "@domain/wallets"
import { GT } from "@graphql/index"
import { UserInputError } from "apollo-server-errors"

const WalletId = new GT.Scalar({
  name: "WalletId",
  description: "Unique identifier of a user",
  parseValue(value) {
    return validPublicWalletIdValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validPublicWalletIdValue(ast.value)
    }
    return new UserInputError("Invalid type for WalletId")
  },
})

function validPublicWalletIdValue(value: string) {
  const checkedWalletId = checkedToWalletPublicId(value)
  if (checkedWalletId instanceof Error) {
    return new UserInputError("Invalid value for WalletId")
  }
  return checkedWalletId
}

export default WalletId
