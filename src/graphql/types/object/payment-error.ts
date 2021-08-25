import { GT } from "@graphql/index"
import UserError from "../abstract/user-error"
import PaymentErrorCode from "../scalar/payment-error-code"

const PaymentError = new GT.Object({
  name: "PaymentError",
  interfaces: () => [UserError],
  isTypeOf: (source) => false && source.code, // TODO: make this work through GQL ENUM values
  fields: () => ({
    message: {
      type: GT.NonNull(GT.String),
    },
    path: {
      type: GT.List(GT.String),
    },

    // Non-interface fields
    code: {
      type: GT.NonNull(PaymentErrorCode),
    },
  }),
})

export default PaymentError
