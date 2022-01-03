import { GT } from "@graphql/index"

import LnPaymentRequest from "../scalar/ln-payment-request"
import PaymentHash from "../scalar/payment-hash"
import LnPaymentSecret from "../scalar/ln-payment-secret"
import SatAmount from "../scalar/sat-amount"

const LnInvoice = GT.Object({
  name: "LnInvoice",
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
    satoshis: {
      type: SatAmount,
      resolve: (source) => source.amount,
    },
  }),
})

export default LnInvoice
