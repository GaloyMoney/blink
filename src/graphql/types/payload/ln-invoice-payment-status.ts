import { GT } from "@graphql/index"

import AppError from "../object/app-error"

import InvoicePaymentStatus from "../scalar/invoice-payment-status"

const LnInvoicePaymentStatusPayload = GT.Object({
  name: "LnInvoicePaymentStatusPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(AppError),
    },
    status: { type: InvoicePaymentStatus },
  }),
})

export default LnInvoicePaymentStatusPayload
