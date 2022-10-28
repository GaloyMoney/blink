import { GT } from "@graphql/index"

import DeviceNotificationTokenCreateMutation from "@graphql/root/mutation/device-notification-token-create"
import IntraLedgerPaymentSendMutation from "@graphql/root/mutation/intraledger-payment-send"
import IntraLedgerUsdPaymentSendMutation from "@graphql/root/mutation/intraledger-usd-payment-send"
import LnInvoiceCreateMutation from "@graphql/root/mutation/ln-invoice-create"
import LnUsdInvoiceCreateMutation from "@graphql/root/mutation/ln-usd-invoice-create"
import LnInvoiceCreateOnBehalfOfRecipientMutation from "@graphql/root/mutation/ln-invoice-create-on-behalf-of-recipient"
import LnUsdInvoiceCreateOnBehalfOfRecipientMutation from "@graphql/root/mutation/ln-usd-invoice-create-on-behalf-of-recipient"
import LnInvoiceFeeProbeMutation from "@graphql/root/mutation/ln-invoice-fee-probe"
import LnUsdInvoiceFeeProbeMutation from "@graphql/root/mutation/ln-usd-invoice-fee-probe"
import LnInvoicePaymentSendMutation from "@graphql/root/mutation/ln-invoice-payment-send"
import LnNoAmountInvoiceCreateMutation from "@graphql/root/mutation/ln-noamount-invoice-create"
import LnNoAmountInvoiceCreateOnBehalfOfRecipientMutation from "@graphql/root/mutation/ln-noamount-invoice-create-on-behalf-of-recipient"
import LnNoAmountInvoiceFeeProbeMutation from "@graphql/root/mutation/ln-noamount-invoice-fee-probe"
import LnNoAmountUsdInvoiceFeeProbeMutation from "@graphql/root/mutation/ln-noamount-usd-invoice-fee-probe"
import LnNoAmountInvoicePaymentSendMutation from "@graphql/root/mutation/ln-noamount-invoice-payment-send"
import LnNoAmountUsdInvoicePaymentSendMutation from "@graphql/root/mutation/ln-noamount-usd-invoice-payment-send"
import OnChainAddressCreateMutation from "@graphql/root/mutation/on-chain-address-create"
import OnChainAddressCurrentMutation from "@graphql/root/mutation/on-chain-address-current"
import UserLoginMutation from "@graphql/root/mutation/user-login"
import UserRequestAuthCodeMutation from "@graphql/root/mutation/user-request-auth-code"
import UserUpdateLanguageMutation from "@graphql/root/mutation/user-update-language"
import UserUpdateUsernameMutation from "@graphql/root/mutation/user-update-username"
import AccountUpdateDefaultWalletIdMutation from "@graphql/root/mutation/account-update-default-wallet-id"
import UserContactUpdateAliasMutation from "@graphql/root/mutation/user-contact-update-alias"
import UserQuizQuestionUpdateCompletedMutation from "@graphql/root/mutation/user-quiz-question-update-completed"
import OnChainPaymentSendMutation from "@graphql/root/mutation/onchain-payment-send"
import OnChainPaymentSendAllMutation from "@graphql/root/mutation/onchain-payment-send-all"
import CaptchaRequestAuthCodeMutation from "@graphql/root/mutation/captcha-request-auth-code"
import CaptchaCreateChallengeMutation from "@graphql/root/mutation/captcha-create-challenge"

// TODO: // const fields: { [key: string]: GraphQLFieldConfig<any, GraphQLContext> }
const fields = {
  // unauthed
  userRequestAuthCode: UserRequestAuthCodeMutation,
  userLogin: UserLoginMutation,

  captchaCreateChallenge: CaptchaCreateChallengeMutation,
  captchaRequestAuthCode: CaptchaRequestAuthCodeMutation,

  lnInvoiceCreateOnBehalfOfRecipient: LnInvoiceCreateOnBehalfOfRecipientMutation,
  lnUsdInvoiceCreateOnBehalfOfRecipient: LnUsdInvoiceCreateOnBehalfOfRecipientMutation,
  lnNoAmountInvoiceCreateOnBehalfOfRecipient:
    LnNoAmountInvoiceCreateOnBehalfOfRecipientMutation,

  // authed
  userQuizQuestionUpdateCompleted: UserQuizQuestionUpdateCompletedMutation,
  deviceNotificationTokenCreate: DeviceNotificationTokenCreateMutation,

  userUpdateLanguage: UserUpdateLanguageMutation,
  userUpdateUsername: UserUpdateUsernameMutation,
  accountUpdateDefaultWalletId: AccountUpdateDefaultWalletIdMutation,
  userContactUpdateAlias: UserContactUpdateAliasMutation,

  lnInvoiceFeeProbe: LnInvoiceFeeProbeMutation,
  lnUsdInvoiceFeeProbe: LnUsdInvoiceFeeProbeMutation,
  lnNoAmountInvoiceFeeProbe: LnNoAmountInvoiceFeeProbeMutation,
  lnNoAmountUsdInvoiceFeeProbe: LnNoAmountUsdInvoiceFeeProbeMutation,

  lnInvoiceCreate: LnInvoiceCreateMutation,
  lnUsdInvoiceCreate: LnUsdInvoiceCreateMutation,
  lnNoAmountInvoiceCreate: LnNoAmountInvoiceCreateMutation,

  lnInvoicePaymentSend: LnInvoicePaymentSendMutation,
  lnNoAmountInvoicePaymentSend: LnNoAmountInvoicePaymentSendMutation,
  lnNoAmountUsdInvoicePaymentSend: LnNoAmountUsdInvoicePaymentSendMutation,

  intraLedgerPaymentSend: IntraLedgerPaymentSendMutation,
  intraLedgerUsdPaymentSend: IntraLedgerUsdPaymentSendMutation,

  onChainAddressCreate: OnChainAddressCreateMutation,
  onChainAddressCurrent: OnChainAddressCurrentMutation,
  onChainPaymentSend: OnChainPaymentSendMutation,
  onChainPaymentSendAll: OnChainPaymentSendAllMutation,
}

const MutationType = GT.Object({
  name: "Mutation",
  fields,
})

export default MutationType
