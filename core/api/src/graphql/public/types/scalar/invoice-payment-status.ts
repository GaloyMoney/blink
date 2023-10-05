import { GT } from "@/graphql/index"

const InvoicePaymentStatus = GT.Enum({
  name: "InvoicePaymentStatus",
  values: {
    PENDING: {},
    PAID: {},
    EXPIRED: {},
  },
})

export default InvoicePaymentStatus
