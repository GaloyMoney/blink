import { InputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"

const OneTimeAuthCode = GT.Scalar({
  name: "OneTimeAuthCode",
  description: "An authentication code valid for a single use",
  parseValue(value) {
    return validOneTimeAuthCodeValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validOneTimeAuthCodeValue(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for OneTimeAuthCode" })
  },
})

function validOneTimeAuthCodeValue(value) {
  // TODO: verify/improve
  if (value.match(/^[0-9_]{6}/i)) {
    return value.toLowerCase()
  }
  return new InputValidationError({ message: "Invalid value for OneTimeAuthCode" })
}

export default OneTimeAuthCode
