import { GT } from "@graphql/index"

import AppError from "../object/app-error"

import PaymentSendResult from "../scalar/payment-send-result"

const PaymentSendPayload = GT.Object({
  name: "PaymentSendPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(AppError),
    },
    status: { type: PaymentSendResult },
  }),
})

export default PaymentSendPayload
