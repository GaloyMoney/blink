import { Lightning } from "@/app"
import { WalletInvoiceStatus } from "@/domain/wallet-invoices"

import { GT } from "@/graphql/index"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import LnInvoicePaymentStatusPayload from "@/graphql/public/types/payload/ln-invoice-payment-status"
import LnInvoicePaymentStatusByRequestInput from "@/graphql/public/types/object/ln-invoice-payment-status-by-request-input"

const LnInvoicePaymentStatusQuery = GT.Field({
  type: GT.NonNull(LnInvoicePaymentStatusPayload),
  args: {
    input: { type: GT.NonNull(LnInvoicePaymentStatusByRequestInput) },
  },
  resolve: async (_, args) => {
    const { paymentRequest } = args.input
    if (paymentRequest instanceof Error) {
      return { errors: [{ message: paymentRequest.message }] }
    }

    const paymentStatusChecker = await Lightning.PaymentStatusChecker(paymentRequest)
    if (paymentStatusChecker instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(paymentStatusChecker)] }
    }

    const paid = await paymentStatusChecker.invoiceIsPaid()
    if (paid instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(paid)] }
    }

    const { paymentHash, isExpired } = paymentStatusChecker

    if (paid) {
      return { errors: [], paymentHash, paymentRequest, status: WalletInvoiceStatus.Paid }
    }

    const status = isExpired ? WalletInvoiceStatus.Expired : WalletInvoiceStatus.Pending
    return { errors: [], paymentHash, paymentRequest, status }
  },
})

export default LnInvoicePaymentStatusQuery
