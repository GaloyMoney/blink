import { GT } from "@graphql/index"

import IError from "../abstract/error"

import LnInvoice from "../object/ln-invoice"

const LnInvoicePayload = GT.Object({
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
