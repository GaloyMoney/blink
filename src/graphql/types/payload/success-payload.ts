import { GT } from "@graphql/index"

import AppError from "../object/app-error"

const SuccessPayload = GT.Object({
  name: "SuccessPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(AppError),
    },
    success: {
      type: GT.Boolean,
    },
  }),
})

export default SuccessPayload
