import { GT } from "@graphql/index"

import AppError from "../object/app-error"
import TwoFASecret from "../object/twofa-secret"

const TwoFAGeneratePayload = GT.Object({
  name: "TwoFAGeneratePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(AppError),
    },
    twoFASecret: {
      type: TwoFASecret,
    },
  }),
})

export default TwoFAGeneratePayload
