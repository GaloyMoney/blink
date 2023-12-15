import IError from "../../../shared/types/abstract/error"

import LnNoAmountInvoice from "../../../shared/types/object/ln-noamount-invoice"

import { GT } from "@/graphql/index"

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
