import IError from "../../../shared/types/abstract/error"

import InvoicePaymentStatus from "../scalar/invoice-payment-status"

import { GT } from "@/graphql/index"

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
