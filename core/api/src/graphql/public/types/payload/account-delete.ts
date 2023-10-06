import IError from "../../../shared/types/abstract/error"

import { GT } from "@/graphql/index"

const AccountDeletePayload = GT.Object({
  name: "AccountDeletePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    success: {
      type: GT.NonNull(GT.Boolean),
    },
  }),
})

export default AccountDeletePayload
