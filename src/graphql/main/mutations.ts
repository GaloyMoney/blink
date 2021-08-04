import { GT } from "../index"
import LnNoAmountInvoiceCreateOnBehalfOfRecipientMutation from "../types/mutations/ln-noamount-invoice-create-on-behalf-of-recipient"

const MutationType = new GT.Object({
  name: "Mutation",
  fields: () => ({
    lnNoAmountInvoiceCreateOnBehalfOfRecipient:
      LnNoAmountInvoiceCreateOnBehalfOfRecipientMutation,
  }),
})

export default MutationType
