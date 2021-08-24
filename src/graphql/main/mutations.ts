import { GT } from "../index"

import LnNoAmountInvoiceCreateMutation from "@graphql/types/mutation/ln-noamount-invoice-create"
import UserRequestAuthCodeMutation from "@graphql/types/mutation/user-request-auth-code"
import LnNoAmountInvoiceCreateOnBehalfOfRecipientMutation from "../types/mutation/ln-noamount-invoice-create-on-behalf-of-recipient"

const MutationType = new GT.Object({
  name: "Mutation",
  fields: () => ({
    userRequestAuthCode: UserRequestAuthCodeMutation,
    lnNoAmountInvoiceCreateOnBehalfOfRecipient:
      LnNoAmountInvoiceCreateOnBehalfOfRecipientMutation,
    lnNoAmountInvoiceCreate: LnNoAmountInvoiceCreateMutation,
  }),
})

export default MutationType
