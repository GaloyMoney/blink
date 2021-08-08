import { GT } from "../index"

import LnInvoicePaymentRequest from "./scalars/ln-invoice-payment-request"
import LnInvoicePaymentHash from "./scalars/ln-invoice-payment-hash"
import LnInvoicePaymentSecret from "./scalars/ln-invoice-payment-secret"

const LnNoAmountInvoice = new GT.Object({
  name: "LnNoAmountInvoice",
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

export default LnNoAmountInvoice
