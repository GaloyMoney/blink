import { Lightning } from "@/app"
import { WalletInvoiceStatus } from "@/domain/wallet-invoices"

import { GT } from "@/graphql/index"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import LnInvoicePaymentStatusPayload from "@/graphql/public/types/payload/ln-invoice-payment-status"
import LnInvoicePaymentStatusByHashInput from "@/graphql/public/types/object/ln-invoice-payment-status-by-hash-input"

const LnInvoicePaymentStatusByHashQuery = GT.Field({
  type: GT.NonNull(LnInvoicePaymentStatusPayload),
  args: {
    input: { type: GT.NonNull(LnInvoicePaymentStatusByHashInput) },
  },
  resolve: async (_, args) => {
    const { paymentHash } = args.input
    if (paymentHash instanceof Error) {
      return { errors: [{ message: paymentHash.message }] }
    }

    const paymentStatusChecker = await Lightning.PaymentStatusCheckerByHash({
      paymentHash,
    })
    if (paymentStatusChecker instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(paymentStatusChecker)] }
    }

    const paid = await paymentStatusChecker.invoiceIsPaid()
    if (paid instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(paid)] }
    }

    const { paymentRequest, isExpired } = paymentStatusChecker

    if (paid) {
      return { errors: [], paymentHash, paymentRequest, status: WalletInvoiceStatus.Paid }
    }

    const status = isExpired ? WalletInvoiceStatus.Expired : WalletInvoiceStatus.Pending
    return { errors: [], paymentHash, paymentRequest, status }
  },
})

export default LnInvoicePaymentStatusByHashQuery
