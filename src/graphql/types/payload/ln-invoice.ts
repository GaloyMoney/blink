import { GT } from "@graphql/index"

import AppError from "../object/app-error"

import LnInvoice from "../object/ln-invoice"

const LnInvoicePayload = GT.Object({
  name: "LnInvoicePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(AppError),
    },
    invoice: {
      type: LnInvoice,
    },
  }),
})

export default LnInvoicePayload
