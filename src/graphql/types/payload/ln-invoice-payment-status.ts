import { GT } from "@graphql/index"
import IError from "../abstract/error"

import TxStatus from "../scalar/tx-status"

const LnInvoicePaymentStatusPayload = new GT.Object({
  name: "LnInvoicePaymentStatusPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    status: { type: TxStatus },
  }),
})

export default LnInvoicePaymentStatusPayload
