import { Lightning } from "@/app"

import { GT } from "@/graphql/index"
import { mapError } from "@/graphql/error-map"
import LnInvoicePaymentStatusPayload from "@/graphql/public/types/payload/ln-invoice-payment-status"
import LnInvoicePaymentStatusInput from "@/graphql/public/types/object/ln-invoice-payment-status-input"
import { WalletInvoiceStatus } from "@/domain/wallet-invoices"

const LnInvoicePaymentStatusQuery = GT.Field({
  type: GT.NonNull(LnInvoicePaymentStatusPayload),
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

    if (paid) return { errors: [], status: WalletInvoiceStatus.Paid }

    const status = paymentStatusChecker.isExpired
      ? WalletInvoiceStatus.Expired
      : WalletInvoiceStatus.Pending
    return { errors: [], status }
  },
})

export default LnInvoicePaymentStatusQuery
