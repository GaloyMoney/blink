import { GT } from "@graphql/index"

import DeviceNotificationTokenCreateMutation from "@graphql/root/mutation/device-notification-token-create"
import IntraLedgerPaymentSendMutation from "@graphql/root/mutation/intraledger-payment-send"
import LnInvoiceCreateMutation from "@graphql/root/mutation/ln-invoice-create"
import LnInvoiceCreateOnBehalfOfRecipientMutation from "@graphql/root/mutation/ln-invoice-create-on-behalf-of-recipient"
import LnInvoiceFeeProbeMutation from "@graphql/root/mutation/ln-invoice-fee-probe"
import LnInvoicePaymentSendMutation from "@graphql/root/mutation/ln-invoice-payment-send"
import LnNoAmountInvoiceCreateMutation from "@graphql/root/mutation/ln-noamount-invoice-create"
import LnNoAmountInvoiceCreateOnBehalfOfRecipientMutation from "@graphql/root/mutation/ln-noamount-invoice-create-on-behalf-of-recipient"
import LnNoAmountInvoiceFeeProbeMutation from "@graphql/root/mutation/ln-noamount-invoice-fee-probe"
import LnNoAmountInvoicePaymentSendMutation from "@graphql/root/mutation/ln-noamount-invoice-payment-send"
import OnChainAddressCreateMutation from "@graphql/root/mutation/on-chain-address-create"
import OnChainAddressCurrentMutation from "@graphql/root/mutation/on-chain-address-current"
import UserLoginMutation from "@graphql/root/mutation/user-login"
import UserRequestAuthCodeMutation from "@graphql/root/mutation/user-request-auth-code"
import UserUpdateLanguageMutation from "@graphql/root/mutation/user-update-language"
import WalletContactUpdateAliasMutation from "@graphql/root/mutation/wallet-contact-update-alias"

const MutationType = new GT.Object({
  name: "Mutation",
  fields: () => ({
    userRequestAuthCode: UserRequestAuthCodeMutation,
    userLogin: UserLoginMutation,

    deviceNotificationTokenCreate: DeviceNotificationTokenCreateMutation,

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

    intraLedgerPaymentSend: IntraLedgerPaymentSendMutation,

    onChainAddressCreate: OnChainAddressCreateMutation,
    onChainAddressCurrent: OnChainAddressCurrentMutation,
  }),
})

export default MutationType
