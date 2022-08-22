import { Lightning } from "@app"

import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"
import InvoicePaymentStatus from "@graphql/types/scalar/invoice-payment-status"
import LnInvoicePaymentStatusInput from "@graphql/types/object/ln-invoice-payment-status-input"

const LnInvoicePaymentStatusQuery = GT.Field({
  type: GT.NonNull(InvoicePaymentStatus),
  args: {
    input: { type: GT.NonNull(LnInvoicePaymentStatusInput) },
  },
  resolve: async (_, args) => {
    const { paymentRequest } = args.input
    if (paymentRequest instanceof Error) throw paymentRequest

    const paymentStatusChecker = await Lightning.PaymentStatusChecker(paymentRequest)
    if (paymentStatusChecker instanceof Error) throw mapError(paymentStatusChecker)

    const paid = await paymentStatusChecker.invoiceIsPaid()
    if (paid instanceof Error) throw mapError(paid)

    if (paid) return "PAID"

    return "PENDING"
  },
})

export default LnInvoicePaymentStatusQuery
