import { InputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"

const AccountApiKeyLabel = GT.Scalar({
  name: "AccountApiKeyLabel",
  description: "Identifier of an account api key",
  parseValue(value) {
    return validAccountApiKeyLabelValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validAccountApiKeyLabelValue(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for AccountApiKeyLabel" })
  },
})

function validAccountApiKeyLabelValue(value) {
  if (value.match(/^[a-z0-9]{3,50}$/i)) {
    return value.trim().toLowerCase()
  }
  return new InputValidationError({ message: "Invalid value for AccountApiKeyLabel" })
}

export default AccountApiKeyLabel
