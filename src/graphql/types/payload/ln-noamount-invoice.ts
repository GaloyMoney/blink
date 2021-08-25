import { GT } from "@graphql/index"
import UserError from "../abstract/error"

import LnNoAmountInvoice from "../object/ln-noamount-invoice"

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
