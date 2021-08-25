import { GT } from "@graphql/index"
import UserError from "../abstract/error"

import InvoicePaymentStatus from "../scalar/invoice-payment-status"

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
