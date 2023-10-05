import IError from "../../../shared/types/abstract/error"

import PaymentSendResult from "../scalar/payment-send-result"

import { GT } from "@/graphql/index"

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
