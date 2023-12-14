import IError from "../../../shared/types/abstract/error"

import { GT } from "@/graphql/index"

import AuthToken from "@/graphql/shared/types/scalar/auth-token"

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
