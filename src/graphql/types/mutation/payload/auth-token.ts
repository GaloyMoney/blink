import { GT } from "@graphql/index"
import AuthToken from "@graphql/types/scalar/auth-token"

import UserError from "../../user-error"

const AuthTokenPayload = new GT.Object({
  name: "AuthTokenPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(UserError),
    },
    authToken: {
      type: AuthToken,
    },
  }),
})

export default AuthTokenPayload
