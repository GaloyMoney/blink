import IError from "../abstract/error"

import { GT } from "@/graphql/index"
import AuthToken from "@/graphql/shared/types/scalar/auth-token"

const AuthTokenPayload = GT.Object({
  name: "AuthTokenPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    authToken: {
      type: AuthToken,
    },
    totpRequired: {
      type: GT.Boolean,
    },
  }),
})

export default AuthTokenPayload
