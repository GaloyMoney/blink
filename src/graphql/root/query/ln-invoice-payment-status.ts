import { Lightning } from "@app"

import { GT } from "@graphql/index"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import LnInvoicePaymentStatusPayload from "@graphql/types/payload/ln-invoice-payment-status"
import LnInvoicePaymentStatusInput from "@graphql/types/object/ln-invoice-payment-status-input"

const LnInvoicePaymentStatusQuery = GT.Field({
  type: GT.NonNull(LnInvoicePaymentStatusPayload),
  args: {
    input: { type: GT.NonNull(LnInvoicePaymentStatusInput) },
  },
  resolve: async (_, args) => {
    const { paymentRequest } = args.input
    if (paymentRequest instanceof Error) throw paymentRequest

    const paymentStatusChecker = await Lightning.PaymentStatusChecker(paymentRequest)
    if (paymentStatusChecker instanceof Error)
      return { errors: [mapAndParseErrorForGqlResponse(paymentStatusChecker)] }

    const paid = await paymentStatusChecker.invoiceIsPaid()
    if (paid instanceof Error) return { errors: [mapAndParseErrorForGqlResponse(paid)] }

    if (paid) return { errors: [], status: "PAID" }

    return { errors: [], status: "PENDING" }
  },
})

export default LnInvoicePaymentStatusQuery
