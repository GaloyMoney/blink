import { GT } from "@graphql/index"

import IError from "../../../shared/types/abstract/error"

import PaymentSendResult from "../scalar/payment-send-result"

const PaymentSendPayload = GT.Object({
  name: "PaymentSendPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    status: { type: PaymentSendResult },
  }),
})

export default PaymentSendPayload
