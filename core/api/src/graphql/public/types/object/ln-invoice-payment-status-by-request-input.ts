import { GT } from "@/graphql/index"
import LnPaymentRequest from "@/graphql/shared/types/scalar/ln-payment-request"

const LnInvoicePaymentStatusByRequestInput = GT.Input({
  name: "LnInvoicePaymentStatusByRequestInput",
  fields: () => ({
    paymentRequest: { type: GT.NonNull(LnPaymentRequest) },
  }),
})

export default LnInvoicePaymentStatusByRequestInput
