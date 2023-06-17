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
  // 32 is the length of a session token in kratos v11
  // 39 is the length of a session token in kratos v13
  if (value.length !== 32 && value.length !== 39) {
    return "Invalid value for AuthToken"
  }

  return value as SessionToken
}

export default AuthToken
