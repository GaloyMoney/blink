import { GT } from "@graphql/index"

import LnNoAmountInvoiceCreateMutation from "@graphql/root/mutation/ln-noamount-invoice-create"
import UserRequestAuthCodeMutation from "@graphql/root/mutation/user-request-auth-code"
import LnNoAmountInvoiceCreateOnBehalfOfRecipientMutation from "@graphql/root/mutation/ln-noamount-invoice-create-on-behalf-of-recipient"
import UserLoginMutation from "@graphql/root/mutation/user-login"
import LnInvoiceCreateMutation from "@graphql/root/mutation/ln-invoice-create"
import lnInvoicePaymentSendMutation from "@graphql/root/mutation/ln-payment-send"

const MutationType = new GT.Object({
  name: "Mutation",
  fields: () => ({
    userRequestAuthCode: UserRequestAuthCodeMutation,
    userLogin: UserLoginMutation,
    lnInvoiceCreate: LnInvoiceCreateMutation,
    lnNoAmountInvoiceCreateOnBehalfOfRecipient:
      LnNoAmountInvoiceCreateOnBehalfOfRecipientMutation,
    lnNoAmountInvoiceCreate: LnNoAmountInvoiceCreateMutation,
    lnInvoicePaymentSend: lnInvoicePaymentSendMutation,
  }),
})

export default MutationType
