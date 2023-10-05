import { checkedToWalletId } from "@/domain/wallets"
import { InputValidationError } from "@/graphql/error"
import { GT } from "@/graphql/index"

const WalletId = GT.Scalar<WalletId | InputValidationError>({
  name: "WalletId",
  description: "Unique identifier of a wallet",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({ message: "Invalid type for WalletId" })
    }
    return validWalletIdValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validWalletIdValue(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for WalletId" })
  },
})

function validWalletIdValue(value: string): WalletId | InputValidationError {
  const checkedWalletId = checkedToWalletId(value)
  if (checkedWalletId instanceof Error) {
    return new InputValidationError({ message: "Invalid value for WalletId" })
  }
  return checkedWalletId
}

export default WalletId
