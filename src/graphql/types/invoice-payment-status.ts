import { GT } from "../index"

const InvoicePaymentStatus = new GT.Enum({
  name: "InvoicePaymentStatus",
  values: {
    PENDING: {},
    PAID: {},
  },
})

export default InvoicePaymentStatus
