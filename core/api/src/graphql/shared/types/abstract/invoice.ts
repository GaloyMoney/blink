import PaymentHash from "../scalar/payment-hash"
import LnPaymentRequest from "../scalar/ln-payment-request"

import LnPaymentSecret from "../scalar/ln-payment-secret"

import InvoicePaymentStatus from "../scalar/invoice-payment-status"

import { GT } from "@/graphql/index"

const IInvoice = GT.Interface({
  name: "Invoice",
  description: "A lightning invoice.",
  fields: () => ({
    paymentRequest: {
      type: GT.NonNull(LnPaymentRequest),
      description: "The bolt11 invoice to be paid.",
    },
    paymentHash: {
      type: GT.NonNull(PaymentHash),
      description: "The payment hash of the lightning invoice.",
    },
    paymentSecret: {
      type: GT.NonNull(LnPaymentSecret),
      description:
        "The payment secret of the lightning invoice. This is not the preimage of the payment hash.",
    },
    paymentStatus: {
      type: GT.NonNull(InvoicePaymentStatus),
      description: "The payment status of the invoice.",
    },
  }),
})

export default IInvoice
