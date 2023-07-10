import { GT } from "@graphql/index"

import IError from "../abstract/error"
import TotpRegistrationId from "../scalar/totp-verify-id"
import TotpSecret from "../scalar/totp-secret"

const UserTotpRegistrationInitiatePayload = GT.Object({
  name: "UserTotpRegistrationInitiatePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    totpRegistrationId: {
      type: TotpRegistrationId,
    },
    totpSecret: {
      type: TotpSecret,
    },
  }),
})

export default UserTotpRegistrationInitiatePayload
