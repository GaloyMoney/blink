import { GT } from "@graphql/index"

const Username = new GT.Scalar({
  name: "Username",
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
  if (value.match(/^[A-Za-z0-9_]{3,50}/)) {
    return value
  }
  return new Error("Invalid value for Username")
}

export default Username
