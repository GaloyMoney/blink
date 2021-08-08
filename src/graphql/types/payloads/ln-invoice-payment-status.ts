import { GT } from "@graphql/index"

import InvoicePaymentStatus from "../invoice-payment-status"
import UserError from "../user-error"

const LnInvoicePaymentStatusPayload = new GT.Object({
  name: "LnInvoicePaymentStatusPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(UserError),
    },
    status: { type: InvoicePaymentStatus },
  }),
})

export default LnInvoicePaymentStatusPayload
