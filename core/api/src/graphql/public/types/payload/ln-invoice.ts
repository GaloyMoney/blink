import LnInvoice from "../../../shared/types/object/ln-invoice"

import IError from "@/graphql/shared/types/abstract/error"
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
