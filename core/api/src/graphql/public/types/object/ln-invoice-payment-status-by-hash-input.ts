import { GT } from "@/graphql/index"
import PaymentHash from "@/graphql/shared/types/scalar/payment-hash"

const LnInvoicePaymentStatusByHashInput = GT.Input({
  name: "LnInvoicePaymentStatusByHashInput",
  fields: () => ({
    paymentHash: { type: GT.NonNull(PaymentHash) },
  }),
})

export default LnInvoicePaymentStatusByHashInput
