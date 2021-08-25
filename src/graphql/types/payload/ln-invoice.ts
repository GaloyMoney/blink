import { GT } from "@graphql/index"
import UserError from "../abstract/error"

import LnInvoice from "../object/ln-invoice"

const LnInvoicePayload = new GT.Object({
  name: "LnInvoicePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(UserError),
    },
    invoice: {
      type: LnInvoice,
    },
  }),
})

export default LnInvoicePayload
