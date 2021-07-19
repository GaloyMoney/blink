import { GT } from "../../index"

const Username = new GT.Scalar({
  name: "Username",
  parseValue(value) {
    return validUsernameValue(value) ? value : null
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validUsernameValue(ast.value) ? ast.value : null
    }
    return null
  },
})

function validUsernameValue(value) {
  return value.match(/^[A-Za-z0-9_]{3,50}/)
}

export default Username
