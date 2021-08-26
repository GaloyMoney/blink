import { GT } from "@graphql/index"

import LnPaymentRequest from "../scalar/ln-payment-request"
import LnPaymentHash from "../scalar/ln-payment-hash"
import LnPaymentSecret from "../scalar/ln-payment-secret"

const LnNoAmountInvoice = new GT.Object({
  name: "LnNoAmountInvoice",
  fields: () => ({
    paymentRequest: {
      type: GT.NonNull(LnPaymentRequest),
    },
    paymentHash: {
      type: GT.NonNull(LnPaymentHash),
    },
    paymentSecret: {
      type: GT.NonNull(LnPaymentSecret),
    },
  }),
})

export default LnNoAmountInvoice
