import { GT } from "@graphql/index"
import AuthToken from "@graphql/types/scalar/auth-token"

import AppError from "../object/app-error"

const AuthTokenPayload = GT.Object({
  name: "AuthTokenPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(AppError),
    },
    authToken: {
      type: AuthToken,
    },
  }),
})

export default AuthTokenPayload
