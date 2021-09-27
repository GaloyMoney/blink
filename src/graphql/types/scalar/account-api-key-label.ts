import { GT } from "@graphql/index"
import { UserInputError } from "apollo-server-errors"

const AccountApiKeyLabel = new GT.Scalar({
  name: "AccountApiKeyLabel",
  description: "Identifier of an account api key",
  parseValue(value) {
    return validAccountApiKeyLabelValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validAccountApiKeyLabelValue(ast.value)
    }
    return new UserInputError("Invalid type for AccountApiKeyLabel")
  },
})

function validAccountApiKeyLabelValue(value) {
  if (value.match(/^[a-z0-9]{3,50}$/i)) {
    return value.trim().toLowerCase()
  }
  return new UserInputError("Invalid value for AccountApiKeyLabel")
}

export default AccountApiKeyLabel
