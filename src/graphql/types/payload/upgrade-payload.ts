import { GT } from "@graphql/index"

import AuthToken from "@graphql/types/scalar/auth-token"

import IError from "../abstract/error"

const UpgradePayload = GT.Object({
  name: "UpgradePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    success: {
      type: GT.NonNull(GT.Boolean),
    },
    authToken: {
      type: AuthToken,
    },
  }),
})

export default UpgradePayload
