import { GT } from "@graphql/index"
import { UserInputError } from "apollo-server-errors"

const LnPubkey = new GT.Scalar({
  name: "LnPubkey",
  parseValue(value) {
    return validLnPubkey(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validLnPubkey(ast.value)
    }
    return new UserInputError("Invalid type for LnPubkey")
  },
})

function validLnPubkey(value) {
  // TODO: verify/improve
  if (value.match(/^[a-f0-9]{66}$/i)) {
    return value
  }
  return new UserInputError("Invalid value for LnPubkey")
}

export default LnPubkey
