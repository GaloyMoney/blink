import { GT } from "@graphql/index"

import LnNoAmountInvoice from "../object/ln-noamount-invoice"
import UserError from "../user-error"

const LnNoAmountInvoicePayload = new GT.Object({
  name: "LnNoAmountInvoicePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(UserError),
    },
    invoice: {
      type: LnNoAmountInvoice,
    },
  }),
})

export default LnNoAmountInvoicePayload
