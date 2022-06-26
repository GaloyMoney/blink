import { InputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"

const OneTimeAuthCode = GT.Scalar({
  name: "OneTimeAuthCode",
  description: "An authentication code valid for a single use",
  // FIXME: OneTimeAuthCode is being used for graphql, but PhoneCode is the domain type
  // this is confusing, as OneTimeAuthCode may suggest a google authenticator code.
  parseValue(value) {
    if (typeof value !== "string") {
      return new InputValidationError({ message: "Invalid type for OneTimeAuthCode" })
    }
    return validOneTimeAuthCodeValue(value)
  },
  parseLiteral(ast) {
    if (ast.kind === GT.Kind.STRING) {
      return validOneTimeAuthCodeValue(ast.value)
    }
    return new InputValidationError({ message: "Invalid type for OneTimeAuthCode" })
  },
})

function validOneTimeAuthCodeValue(value: string) {
  if (value.match(/^[0-9]{6}/i)) {
    return value.toLowerCase() as PhoneCode
  }
  return new InputValidationError({ message: "Invalid value for OneTimeAuthCode" })
}

export default OneTimeAuthCode
