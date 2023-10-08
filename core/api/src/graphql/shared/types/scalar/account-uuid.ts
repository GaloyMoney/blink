import { checkedToAccountUuid } from "@/domain/accounts"
import { InputValidationError } from "@/graphql/error"
import { GT } from "@/graphql/index"

const AccountUuid = GT.Scalar<AccountUuid | InputValidationError>({
  name: "AccountUuid",
  description: "Unique identifier of an account",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({ message: "Invalid type for AccountUuid" })
    }
    return validAccountUuidValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validAccountUuidValue(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for AccountUuid" })
  },
})

function validAccountUuidValue(value: string): AccountUuid | InputValidationError {
  const checkedAccountUuid = checkedToAccountUuid(value)
  if (checkedAccountUuid instanceof Error) {
    return new InputValidationError({ message: "Invalid value for AccountUuid" })
  }
  return checkedAccountUuid
}

export default AccountUuid
