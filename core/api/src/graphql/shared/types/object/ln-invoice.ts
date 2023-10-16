import LnPaymentRequest from "../scalar/ln-payment-request"
import PaymentHash from "../scalar/payment-hash"
import LnPaymentSecret from "../scalar/ln-payment-secret"
import SatAmount from "../scalar/sat-amount"

import { GT } from "@/graphql/index"

const LnInvoice = GT.Object<LnInvoice>({
  name: "LnInvoice",
  isTypeOf: (source) => !!source.amount,
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
