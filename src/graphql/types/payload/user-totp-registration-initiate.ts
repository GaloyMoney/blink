import { GT } from "@graphql/index"

import IError from "../abstract/error"
import Flow from "../scalar/flow"
import TotpSecret from "../scalar/totp-secret"

const UserTotpRegistrationInitiatePayload = GT.Object({
  name: "UserTotpRegistrationInitiatePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    flow: {
      type: Flow,
    },
    totpSecret: {
      type: TotpSecret,
    },
  }),
})

export default UserTotpRegistrationInitiatePayload
