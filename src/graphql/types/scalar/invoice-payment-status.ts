import { GT } from "@graphql/index"

const InvoicePaymentStatus = GT.Enum({
  name: "InvoicePaymentStatus",
  values: {
    PENDING: {},
    PAID: {},
  },
})

export default InvoicePaymentStatus
