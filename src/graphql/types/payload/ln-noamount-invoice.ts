import { GT } from "@graphql/index"

import IError from "../abstract/error"

import LnNoAmountInvoice from "../object/ln-noamount-invoice"

const LnNoAmountInvoicePayload = GT.Object({
  name: "LnNoAmountInvoicePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    invoice: {
      type: LnNoAmountInvoice,
    },
  }),
})

export default LnNoAmountInvoicePayload
