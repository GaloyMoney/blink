import { GT } from "@graphql/index"

import AppError from "../object/app-error"

import LnNoAmountInvoice from "../object/ln-noamount-invoice"

const LnNoAmountInvoicePayload = GT.Object({
  name: "LnNoAmountInvoicePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(AppError),
    },
    invoice: {
      type: LnNoAmountInvoice,
    },
  }),
})

export default LnNoAmountInvoicePayload
