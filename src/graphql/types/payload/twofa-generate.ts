import { GT } from "@graphql/index"

import IError from "../abstract/error"
import TwoFASecret from "../object/twofa-secret"

const TwoFAGeneratePayload = GT.Object({
  name: "TwoFAGeneratePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    twoFASecret: {
      type: TwoFASecret,
    },
  }),
})

export default TwoFAGeneratePayload
