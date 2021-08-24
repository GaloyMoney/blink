import LnNoAmountInvoiceCreateMutation from "@graphql/types/mutation/ln-noamount-invoice-create"
import { GT } from "../index"
import LnNoAmountInvoiceCreateOnBehalfOfRecipientMutation from "../types/mutation/ln-noamount-invoice-create-on-behalf-of-recipient"

const MutationType = new GT.Object({
  name: "Mutation",
  fields: () => ({
    lnNoAmountInvoiceCreateOnBehalfOfRecipient:
      LnNoAmountInvoiceCreateOnBehalfOfRecipientMutation,
    lnNoAmountInvoiceCreate: LnNoAmountInvoiceCreateMutation,
  }),
})

export default MutationType
