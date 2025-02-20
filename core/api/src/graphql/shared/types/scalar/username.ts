import { UsernameRegex } from "@/domain/accounts"
import { InputValidationError } from "@/graphql/error"
import { GT } from "@/graphql/index"
import { PhoneNumberRegex } from "@/domain/users"

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
  if (value.match(PhoneNumberRegex)) {
    return value
  }
  return new InputValidationError({ message: "Invalid value for Username" })
}

export default Username
