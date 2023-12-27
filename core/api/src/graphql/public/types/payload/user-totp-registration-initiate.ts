import TotpRegistrationId from "../scalar/totp-verify-id"
import TotpSecret from "../scalar/totp-secret"

import IError from "@/graphql/shared/types/abstract/error"
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
