import { GT } from "@/graphql/index"
import PaymentHash from "@/graphql/shared/types/scalar/payment-hash"
import LnPaymentRequest from "@/graphql/shared/types/scalar/ln-payment-request"
import InvoicePaymentStatus from "@/graphql/shared/types/scalar/invoice-payment-status"

const LnInvoicePaymentStatus = GT.Object({
  name: "LnInvoicePaymentStatus",
  fields: () => ({
    paymentHash: { type: PaymentHash },
    paymentRequest: { type: LnPaymentRequest },
    status: { type: InvoicePaymentStatus },
  }),
})

export default LnInvoicePaymentStatus
