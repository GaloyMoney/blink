import LnPaymentRequest from "../scalar/ln-payment-request"
import PaymentHash from "../scalar/payment-hash"
import LnPaymentSecret from "../scalar/ln-payment-secret"

import { GT } from "@/graphql/index"
import InvoicePaymentStatus from "../scalar/invoice-payment-status"

const LnNoAmountInvoice = GT.Object<LnInvoice>({
  name: "LnNoAmountInvoice",
  isTypeOf: (source) => !source.amount,
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
    status: {
      type: GT.NonNull(InvoicePaymentStatus),
      resolve: (source) => {
        
      }
    }
  }),
})

export default LnNoAmountInvoice
