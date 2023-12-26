import InvoicePaymentStatus from "../../../shared/types/scalar/invoice-payment-status"

import IError from "@/graphql/shared/types/abstract/error"
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
