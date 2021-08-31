import { GT } from "@graphql/index"

import LnInvoiceCreateMutation from "@graphql/root/mutation/ln-invoice-create"
import LnInvoiceCreateOnBehalfOfRecipientMutation from "@graphql/root/mutation/ln-invoice-create-on-behalf-of-recipient"
import LnInvoiceFeeProbeMutation from "@graphql/root/mutation/ln-invoice-fee-probe"
import LnInvoicePaymentSendMutation from "@graphql/root/mutation/ln-invoice-payment-send"
import LnNoAmountInvoiceCreateMutation from "@graphql/root/mutation/ln-noamount-invoice-create"
import LnNoAmountInvoiceCreateOnBehalfOfRecipientMutation from "@graphql/root/mutation/ln-noamount-invoice-create-on-behalf-of-recipient"
import LnNoAmountInvoiceFeeProbeMutation from "@graphql/root/mutation/ln-noamount-invoice-fee-probe"
import LnNoAmountInvoicePaymentSendMutation from "@graphql/root/mutation/ln-noamount-invoice-payment-send"
import UserLoginMutation from "@graphql/root/mutation/user-login"
import UserRequestAuthCodeMutation from "@graphql/root/mutation/user-request-auth-code"
import WalletContactUpdateAliasMutation from "@graphql/root/mutation/wallet-contact-update-alias"
import UserUpdateLanguageMutation from "@graphql/root/mutation/user-update-language"

const MutationType = new GT.Object({
  name: "Mutation",
  fields: () => ({
    userRequestAuthCode: UserRequestAuthCodeMutation,
    userLogin: UserLoginMutation,

    userUpdateLanguage: UserUpdateLanguageMutation,
    walletContactUpdateAlias: WalletContactUpdateAliasMutation,

    lnInvoiceFeeProbe: LnInvoiceFeeProbeMutation,
    lnNoAmountInvoiceFeeProbe: LnNoAmountInvoiceFeeProbeMutation,

    lnInvoiceCreate: LnInvoiceCreateMutation,
    lnNoAmountInvoiceCreate: LnNoAmountInvoiceCreateMutation,

    lnInvoiceCreateOnBehalfOfRecipient: LnInvoiceCreateOnBehalfOfRecipientMutation,
    lnNoAmountInvoiceCreateOnBehalfOfRecipient:
      LnNoAmountInvoiceCreateOnBehalfOfRecipientMutation,

    lnInvoicePaymentSend: LnInvoicePaymentSendMutation,
    lnNoAmountInvoicePaymentSend: LnNoAmountInvoicePaymentSendMutation,
  }),
})

export default MutationType
