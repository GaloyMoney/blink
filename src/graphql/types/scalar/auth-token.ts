import { GT } from "@graphql/index"
import { checkedToSessionToken } from "@services/kratos"

const AuthToken = GT.Scalar({
  name: "AuthToken",
  description: "An Opaque Bearer token",
  serialize(value) {
    if (typeof value !== "string") {
      return "Invalid value for AuthToken"
    }
    return checkedToSessionToken(value)
  },
})

export default AuthToken
