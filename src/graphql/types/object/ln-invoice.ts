import { GT } from "@graphql/index"

import LnInvoicePaymentRequest from "../scalar/ln-invoice-payment-request"
import LnInvoicePaymentHash from "../scalar/ln-invoice-payment-hash"
import LnInvoicePaymentSecret from "../scalar/ln-invoice-payment-secret"
import SatAmount from "../scalar/sat-amount"

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
    satoshis: {
      type: SatAmount,
      resolve: (source) => source.amount,
    },
  }),
})

export default LnInvoice
