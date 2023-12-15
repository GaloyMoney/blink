import IError from "../../../shared/types/abstract/error"
import TotpRegistrationId from "../scalar/totp-verify-id"
import TotpSecret from "../scalar/totp-secret"

import { GT } from "@/graphql/index"

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
