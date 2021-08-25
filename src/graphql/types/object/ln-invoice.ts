import { GT } from "@graphql/index"

import LnInvoicePaymentRequest from "../scalar/ln-invoice-payment-request"
import LnInvoicePaymentHash from "../scalar/ln-invoice-payment-hash"
import LnInvoicePaymentSecret from "../scalar/ln-invoice-payment-secret"

const LnInvoice = new GT.Object({
  name: "LnInvoice",
  fields: () => ({
    paymentRequest: {
      type: GT.NonNull(LnInvoicePaymentRequest),
    },
    paymentHash: {
      type: GT.NonNull(LnInvoicePaymentHash),
    },
    paymentSecret: {
      type: GT.NonNull(LnInvoicePaymentSecret),
    },
  }),
})

export default LnInvoice
