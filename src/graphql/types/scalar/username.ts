import { UsernameRegex } from "@domain/users"
import { GT } from "@graphql/index"
import { UserInputError } from "apollo-server-errors"

const Username = new GT.Scalar({
  name: "Username",
  description: "Unique identifier of a user",
  parseValue(value) {
    return validUsernameValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validUsernameValue(ast.value)
    }
    return new UserInputError("Invalid type for Username")
  },
})

function validUsernameValue(value) {
  if (value.match(UsernameRegex)) {
    return value.toLowerCase()
  }
  return new UserInputError("Invalid value for Username")
}

export default Username
