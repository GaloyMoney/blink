import LnPaymentRequest from "../scalar/ln-payment-request"
import PaymentHash from "../scalar/payment-hash"
import LnPaymentSecret from "../scalar/ln-payment-secret"

import IInvoice from "../abstract/invoice"

import { GT } from "@/graphql/index"
// import InvoicePaymentStatus from "../scalar/invoice-payment-status"

const LnNoAmountInvoice = GT.Object<WalletInvoice>({
  name: "LnNoAmountInvoice",
  interfaces: () => [IInvoice],
  isTypeOf: (source) => !source.lnInvoice.amount,
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
  }),
})

export default LnNoAmountInvoice
