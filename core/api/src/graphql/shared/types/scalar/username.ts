import { UsernameRegex } from "@/domain/accounts"
import { checkedToPhoneNumber } from "@/domain/users"
import { InputValidationError } from "@/graphql/error"
import { GT } from "@/graphql/index"

const Username = GT.Scalar({
  name: "Username",
  description: "Unique identifier of a user",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({ message: "Invalid type for Username" })
    }
    return validUsernameValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validUsernameValue(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for Username" })
  },
})

function validUsernameValue(value: string) {
  if (value.match(UsernameRegex)) {
    return value.toLowerCase()
  }

  const checkedPhoneNumber = checkedToPhoneNumber(value)
  if (!(checkedPhoneNumber instanceof Error)) {
    return checkedPhoneNumber
  }

  return new InputValidationError({ message: "Invalid value for Username" })
}

export default Username
