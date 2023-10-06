import LnPaymentRequest from "../../../shared/types/scalar/ln-payment-request"
import PaymentHash from "../../../shared/types/scalar/payment-hash"
import LnPaymentSecret from "../../../shared/types/scalar/ln-payment-secret"

import { GT } from "@/graphql/index"

const LnNoAmountInvoice = GT.Object({
  name: "LnNoAmountInvoice",
  fields: () => ({
    paymentRequest: {
      type: GT.NonNull(LnPaymentRequest),
    },
    paymentHash: {
      type: GT.NonNull(PaymentHash),
    },
    paymentSecret: {
      type: GT.NonNull(LnPaymentSecret),
    },
  }),
})

export default LnNoAmountInvoice
