import LnPaymentRequest from "../scalar/ln-payment-request"
import PaymentHash from "../scalar/payment-hash"
import LnPaymentSecret from "../scalar/ln-payment-secret"
import SatAmount from "../scalar/sat-amount"

import IInvoice from "../abstract/invoice"

import { GT } from "@/graphql/index"

const LnInvoice = GT.Object<WalletInvoice>({
  name: "LnInvoice",
  interfaces: () => [IInvoice],
  isTypeOf: (source) => !!source.lnInvoice.amount,
  fields: () => ({
    paymentRequest: {
      type: GT.NonNull(LnPaymentRequest),
      resolve: (source) => source.lnInvoice.paymentRequest,
    },
    paymentHash: {
      type: GT.NonNull(PaymentHash),
      resolve: (source) => source.lnInvoice.paymentHash,
    },
    paymentSecret: {
      type: GT.NonNull(LnPaymentSecret),
      resolve: (source) => source.lnInvoice.paymentSecret,
    },
    satoshis: {
      type: SatAmount,
      resolve: (source) => source.lnInvoice.amount,
    },
  }),
})

export default LnInvoice
