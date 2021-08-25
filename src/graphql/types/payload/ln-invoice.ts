import { GT } from "@graphql/index"
import IError from "../abstract/error"

import LnInvoice from "../object/ln-invoice"

const LnInvoicePayload = new GT.Object({
  name: "LnInvoicePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    invoice: {
      type: LnInvoice,
    },
  }),
})

export default LnInvoicePayload
