import { WalletInvoiceStatus } from "@/domain/wallet-invoices"
import { GT } from "@/graphql/index"

const InvoicePaymentStatus = GT.Enum({
  name: "InvoicePaymentStatus",
  values: {
    PENDING: {
      value: WalletInvoiceStatus.Pending,
    },
    PAID: {
      value: WalletInvoiceStatus.Paid,
    },
    EXPIRED: {
      value: WalletInvoiceStatus.Expired,
    },
  },
})

export default InvoicePaymentStatus
