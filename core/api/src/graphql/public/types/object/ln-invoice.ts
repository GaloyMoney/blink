import { GT } from "@graphql/index"

import LnPaymentRequest from "../../../shared/types/scalar/ln-payment-request"
import PaymentHash from "../../../shared/types/scalar/payment-hash"
import LnPaymentSecret from "../../../shared/types/scalar/ln-payment-secret"
import SatAmount from "../../../shared/types/scalar/sat-amount"

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
