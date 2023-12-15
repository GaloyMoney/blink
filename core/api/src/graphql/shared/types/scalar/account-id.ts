import { checkedToAccountId } from "@/domain/accounts"
import { InputValidationError } from "@/graphql/error"
import { GT } from "@/graphql/index"

const AccountId = GT.Scalar<AccountId | InputValidationError>({
  name: "AccountId",
  description: "Unique identifier of an account",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({ message: "Invalid type for AccountId" })
    }
    return validAccountIdValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validAccountIdValue(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for AccountId" })
  },
})

function validAccountIdValue(value: string): AccountId | InputValidationError {
  const checkedAccountId = checkedToAccountId(value)
  if (checkedAccountId instanceof Error) {
    return new InputValidationError({ message: "Invalid value for AccountId" })
  }
  return checkedAccountId
}

export default AccountId
