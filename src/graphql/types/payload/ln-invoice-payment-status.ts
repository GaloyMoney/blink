import { GT } from "@graphql/index"

import IError from "../abstract/error"

import InvoicePaymentStatus from "../scalar/invoice-payment-status"

const LnInvoicePaymentStatusPayload = GT.Object({
  name: "LnInvoicePaymentStatusPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    status: { type: InvoicePaymentStatus },
  }),
})

export default LnInvoicePaymentStatusPayload
