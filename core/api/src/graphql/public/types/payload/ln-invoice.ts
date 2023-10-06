import IError from "../../../shared/types/abstract/error"

import LnInvoice from "../../../shared/types/object/ln-invoice"

import { GT } from "@/graphql/index"

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
