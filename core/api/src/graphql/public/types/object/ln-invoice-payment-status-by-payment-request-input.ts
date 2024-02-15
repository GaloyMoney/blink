import { GT } from "@/graphql/index"
import LnPaymentRequest from "@/graphql/shared/types/scalar/ln-payment-request"

const LnInvoicePaymentStatusByPaymentRequestInput = GT.Input({
  name: "LnInvoicePaymentStatusByPaymentRequestInput",
  fields: () => ({
    paymentRequest: { type: GT.NonNull(LnPaymentRequest) },
  }),
})

export default LnInvoicePaymentStatusByPaymentRequestInput
