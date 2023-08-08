import { GT } from "@graphql/index"

import IError from "../abstract/error"

const SuccessPayload = GT.Object({
  name: "SuccessPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    success: {
      // TODO: success should be mandatory
      type: GT.Boolean,
    },
  }),
})

export default SuccessPayload
