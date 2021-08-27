import { GT } from "@graphql/index"
import IError from "../abstract/error"

import LnPaymentSendResult from "../scalar/ln-payment-send-result"

const LnInvoicePaymentPaymentSendPayload = new GT.Object({
  name: "LnInvoicePaymentPaymentSendPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    result: { type: LnPaymentSendResult },
  }),
})

export default LnInvoicePaymentPaymentSendPayload
