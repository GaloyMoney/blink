import { GT } from "@graphql/index"
import AuthToken from "@graphql/types/scalar/auth-token"

import IError from "../abstract/error"

const AuthTokenPayload = GT.Object({
  name: "AuthTokenPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    authToken: {
      type: AuthToken,
    },
  }),
})

export default AuthTokenPayload
