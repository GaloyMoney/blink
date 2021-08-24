import { GT } from "@graphql/index"

const AuthToken = new GT.Scalar({
  name: "AuthToken",
  description: "An authentication code valid for a single use",
  parseValue(value) {
    return validAuthTokenValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validAuthTokenValue(ast.value)
    }
    return new Error("Invalid type for AuthToken")
  },
})

function validAuthTokenValue(value) {
  // TODO: verify/improve
  if (value.match(/^[a-z0-9]+/i)) {
    return value
  }
  return new Error("Invalid value for AuthToken")
}

export default AuthToken
