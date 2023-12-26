import LnNoAmountInvoice from "../../../shared/types/object/ln-noamount-invoice"

import IError from "@/graphql/shared/types/abstract/error"
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
