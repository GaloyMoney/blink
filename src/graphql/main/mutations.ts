import { GT } from "@graphql/index"

import LnInvoiceCreateMutation from "@graphql/root/mutation/ln-invoice-create"
import LnInvoiceCreateOnBehalfOfRecipientMutation from "@graphql/root/mutation/ln-invoice-create-on-behalf-of-recipient"
import LnInvoiceFeeProbeMutation from "@graphql/root/mutation/ln-invoice-fee-probe"
import lnInvoicePaymentSendMutation from "@graphql/root/mutation/ln-payment-send"
import LnNoAmountInvoiceCreateMutation from "@graphql/root/mutation/ln-noamount-invoice-create"
import LnNoAmountInvoiceCreateOnBehalfOfRecipientMutation from "@graphql/root/mutation/ln-noamount-invoice-create-on-behalf-of-recipient"
import LnNoAmountInvoiceFeeProbeMutation from "@graphql/root/mutation/ln-noamount-invoice-fee-probe"
import lnNoAmountInvoicePaymentSendMutation from "@graphql/root/mutation/ln-noamount-payment-send"
import UserLoginMutation from "@graphql/root/mutation/user-login"
import UserRequestAuthCodeMutation from "@graphql/root/mutation/user-request-auth-code"

const MutationType = new GT.Object({
  name: "Mutation",
  fields: () => ({
    userRequestAuthCode: UserRequestAuthCodeMutation,
    userLogin: UserLoginMutation,

    lnInvoiceFeeProbe: LnInvoiceFeeProbeMutation,
    lnNoAmountInvoiceFeeProbe: LnNoAmountInvoiceFeeProbeMutation,

    lnInvoiceCreate: LnInvoiceCreateMutation,
    lnNoAmountInvoiceCreate: LnNoAmountInvoiceCreateMutation,

    lnInvoiceCreateOnBehalfOfRecipient: LnInvoiceCreateOnBehalfOfRecipientMutation,
    lnNoAmountInvoiceCreateOnBehalfOfRecipient:
      LnNoAmountInvoiceCreateOnBehalfOfRecipientMutation,

    lnInvoicePaymentSend: lnInvoicePaymentSendMutation,
    lnNoAmountInvoicePaymentSend: lnNoAmountInvoicePaymentSendMutation,
  }),
})

export default MutationType
