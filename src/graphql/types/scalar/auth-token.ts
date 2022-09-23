import { GT } from "@graphql/index"

const AuthToken = GT.Scalar({
  name: "AuthToken",
  description: "An Opaque Bearer token",
  serialize(value) {
    if (typeof value !== "string") {
      return "Invalid value for AuthToken"
    }
    return validAuthTokenValue(value)
  },
})

function validAuthTokenValue(value: string) {
  if (value.length !== 32) {
    return "Invalid value for AuthToken"
  }

  return value
}

export default AuthToken
