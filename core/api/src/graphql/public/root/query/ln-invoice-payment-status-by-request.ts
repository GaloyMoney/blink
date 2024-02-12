import { Lightning } from "@/app"
import { WalletInvoiceStatus } from "@/domain/wallet-invoices"

import { GT } from "@/graphql/index"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import LnInvoicePaymentStatus from "@/graphql/public/types/object/ln-invoice-payment-status"
import LnInvoicePaymentStatusByRequestInput from "@/graphql/public/types/object/ln-invoice-payment-status-by-request-input"

const LnInvoicePaymentStatusByRequestQuery = GT.Field({
  type: GT.NonNull(LnInvoicePaymentStatus),
  args: {
    input: { type: GT.NonNull(LnInvoicePaymentStatusByRequestInput) },
  },
  resolve: async (_, args) => {
    const { paymentRequest } = args.input
    if (paymentRequest instanceof Error) throw paymentRequest

    const paymentStatusChecker = await Lightning.PaymentStatusChecker(paymentRequest)
    if (paymentStatusChecker instanceof Error) {
      throw mapAndParseErrorForGqlResponse(paymentStatusChecker)
    }

    const paid = await paymentStatusChecker.invoiceIsPaid()
    if (paid instanceof Error) {
      throw mapAndParseErrorForGqlResponse(paid)
    }

    const { paymentHash, isExpired } = paymentStatusChecker

    if (paid) {
      return { paymentHash, paymentRequest, status: WalletInvoiceStatus.Paid }
    }

    const status = isExpired ? WalletInvoiceStatus.Expired : WalletInvoiceStatus.Pending
    return { paymentHash, paymentRequest, status }
  },
})

export default LnInvoicePaymentStatusByRequestQuery
