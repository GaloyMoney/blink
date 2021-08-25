import { GT } from "@graphql/index"
import UserError from "../abstract/error"

const SuccessPayload = new GT.Object({
  name: "SuccessPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(UserError),
    },
    success: {
      type: GT.Boolean,
    },
  }),
})

export default SuccessPayload
