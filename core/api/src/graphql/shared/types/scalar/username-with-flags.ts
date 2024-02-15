import { UsernameWithFlagsRegex } from "@/domain/accounts"
import { InputValidationError } from "@/graphql/error"
import { GT } from "@/graphql/index"

const UsernameWithFlags = GT.Scalar({
  name: "UsernameWithFlags",
  description: "Unique identifier of a user, with optional flags",
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({
        message: "Invalid type for Username with optional flags",
      })
    }
    return validUsernameWithFlagsValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validUsernameWithFlagsValue(ast.value)
    }
    return new InputValidationError({
      message: "Invalid type for Username with optional flags",
    })
  },
})

function validUsernameWithFlagsValue(value: string) {
  if (value.match(UsernameWithFlagsRegex)) {
    return value.toLowerCase()
  }
  return new InputValidationError({
    message: "Invalid value for Username with optional flags",
  })
}

export default UsernameWithFlags
