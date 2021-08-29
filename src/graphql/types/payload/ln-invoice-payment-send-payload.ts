import { GT } from "@graphql/index"
import IError from "../abstract/error"

import LnPaymentSendResult from "../scalar/ln-payment-send-result"

const LnInvoicePaymentSendPayload = new GT.Object({
  name: "LnInvoicePaymentSendPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    status: { type: LnPaymentSendResult },
  }),
})

export default LnInvoicePaymentSendPayload
