import { GT } from "../index"

const InvoicePaymentStatus = new GT.Enum({
  name: "InvoicePaymentStatus",
  values: {
    PAID: {},
    NOT_PAID: {},
  },
})

export default InvoicePaymentStatus
