import { GT } from "@graphql/index"

import UserError from "../user-error"

const AuthCodeRequestPayload = new GT.Object({
  name: "AuthCodeRequestPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(UserError),
    },
    success: { type: GT.NonNull(GT.Boolean) },
  }),
})

export default AuthCodeRequestPayload
