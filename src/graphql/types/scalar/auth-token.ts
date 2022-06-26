import { OutputValidationError } from "@graphql/error"
import { GT } from "@graphql/index"

const AuthToken = GT.Scalar({
  name: "AuthToken",
  description: "An JWT-formatted authentication token",
  serialize(value) {
    if (typeof value !== "string") {
      return new OutputValidationError({ message: "Invalid type for AuthToken" })
    }
    return validAuthTokenValue(value)
  },
})

function validAuthTokenValue(value: string) {
  const jwtRegex = /^([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_\-+/=]*)/gi
  if (value.match(jwtRegex)) {
    return value
  }
  return new OutputValidationError({ message: "Invalid value for AuthToken" })
}

export default AuthToken
