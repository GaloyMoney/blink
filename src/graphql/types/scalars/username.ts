import { GT } from "@graphql/index"

const Username = new GT.Scalar({
  name: "Username",
  description: "Unique identifier of an API user",
  parseValue(value) {
    return validUsernameValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validUsernameValue(ast.value)
    }
    return new Error("Invalid type for Username")
  },
})

function validUsernameValue(value) {
  if (value.match(/^[a-z0-9_]{3,50}/i)) {
    return value.toLowerCase()
  }
  return new Error("Invalid value for Username")
}

export default Username
