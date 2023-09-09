import { GT } from "@graphql/index"

import DeviceNotificationTokenCreateMutation from "@graphql/public/root/mutation/device-notification-token-create"
import IntraLedgerPaymentSendMutation from "@graphql/public/root/mutation/intraledger-payment-send"
import IntraLedgerUsdPaymentSendMutation from "@graphql/public/root/mutation/intraledger-usd-payment-send"
import LnInvoiceCreateMutation from "@graphql/public/root/mutation/ln-invoice-create"
import LnUsdInvoiceCreateMutation from "@graphql/public/root/mutation/ln-usd-invoice-create"
import LnInvoiceCreateOnBehalfOfRecipientMutation from "@graphql/public/root/mutation/ln-invoice-create-on-behalf-of-recipient"
import LnUsdInvoiceCreateOnBehalfOfRecipientMutation from "@graphql/public/root/mutation/ln-usd-invoice-create-on-behalf-of-recipient"
import LnInvoiceFeeProbeMutation from "@graphql/public/root/mutation/ln-invoice-fee-probe"
import LnUsdInvoiceFeeProbeMutation from "@graphql/public/root/mutation/ln-usd-invoice-fee-probe"
import LnInvoicePaymentSendMutation from "@graphql/public/root/mutation/ln-invoice-payment-send"
import LnNoAmountInvoiceCreateMutation from "@graphql/public/root/mutation/ln-noamount-invoice-create"
import LnNoAmountInvoiceCreateOnBehalfOfRecipientMutation from "@graphql/public/root/mutation/ln-noamount-invoice-create-on-behalf-of-recipient"
import LnNoAmountInvoiceFeeProbeMutation from "@graphql/public/root/mutation/ln-noamount-invoice-fee-probe"
import LnNoAmountUsdInvoiceFeeProbeMutation from "@graphql/public/root/mutation/ln-noamount-usd-invoice-fee-probe"
import LnNoAmountInvoicePaymentSendMutation from "@graphql/public/root/mutation/ln-noamount-invoice-payment-send"
import LnNoAmountUsdInvoicePaymentSendMutation from "@graphql/public/root/mutation/ln-noamount-usd-invoice-payment-send"
import OnChainAddressCreateMutation from "@graphql/public/root/mutation/on-chain-address-create"
import OnChainAddressCurrentMutation from "@graphql/public/root/mutation/on-chain-address-current"
import UserLoginMutation from "@graphql/shared/root/mutation/user-login"

import UserLogoutMutation from "@graphql/public/root/mutation/user-logout"
import UserUpdateLanguageMutation from "@graphql/public/root/mutation/user-update-language"
import UserUpdateUsernameMutation from "@graphql/public/root/mutation/user-update-username"
import AccountUpdateDefaultWalletIdMutation from "@graphql/public/root/mutation/account-update-default-wallet-id"
import AccountUpdateDisplayCurrencyMutation from "@graphql/public/root/mutation/account-update-display-currency"
import UserContactUpdateAliasMutation from "@graphql/public/root/mutation/user-contact-update-alias"
import UserQuizQuestionUpdateCompletedMutation from "@graphql/public/root/mutation/user-quiz-question-update-completed"
import OnChainPaymentSendMutation from "@graphql/public/root/mutation/onchain-payment-send"
import OnChainUsdPaymentSendMutation from "@graphql/public/root/mutation/onchain-usd-payment-send"
import OnChainUsdPaymentSendAsBtcDenominatedMutation from "@graphql/public/root/mutation/onchain-usd-payment-send-as-sats"
import OnChainPaymentSendAllMutation from "@graphql/public/root/mutation/onchain-payment-send-all"
import CaptchaRequestAuthCodeMutation from "@graphql/shared/root/mutation/captcha-request-auth-code"
import CaptchaCreateChallengeMutation from "@graphql/shared/root/mutation/captcha-create-challenge"
import QuizCompletedMutation from "@graphql/public/root/mutation/quiz-completed"
import AccountDeleteMutation from "@graphql/public/root/mutation/account-delete"
import UserLoginUpgradeMutation from "@graphql/public/root/mutation/user-login-upgrade"
import UserEmailRegistrationInitiateMutation from "@graphql/public/root/mutation/user-email-registration-initiate"
import UserEmailRegistrationValidateMutation from "@graphql/public/root/mutation/user-email-registration-validate"
import FeedbackSubmitMutation from "@graphql/public/root/mutation/feedback-submit"
import UserEmailDeleteMutation from "@graphql/public/root/mutation/user-email-delete"
import UserPhoneDeleteMutation from "@graphql/public/root/mutation/user-phone-delete"
import UserTotpRegistrationInitiateMutation from "@graphql/public/root/mutation/user-totp-registration-initiate"
import UserTotpRegistrationValidateMutation from "@graphql/public/root/mutation/user-totp-registration-validate"
import UserPhoneRegistrationInitiateMutation from "@graphql/public/root/mutation/user-phone-registration-initiate"
import UserPhoneRegistrationValidateMutation from "@graphql/public/root/mutation/user-phone-registration-validate"
import UserTotpDeleteMutation from "@graphql/public/root/mutation/user-totp-delete"

import CallbackEndpointAdd from "./root/mutation/callback-endpoint-add"
import CallbackEndpointDelete from "./root/mutation/callback-endpoint-delete"

// TODO: // const fields: { [key: string]: GraphQLFieldConfig<any, GraphQLPublicContext> }
export const mutationFields = {
  unauthed: {
    captchaCreateChallenge: CaptchaCreateChallengeMutation,
    captchaRequestAuthCode: CaptchaRequestAuthCodeMutation,
    userLogin: UserLoginMutation,
    userLogout: UserLogoutMutation,

    lnInvoiceCreateOnBehalfOfRecipient: LnInvoiceCreateOnBehalfOfRecipientMutation,
    lnUsdInvoiceCreateOnBehalfOfRecipient: LnUsdInvoiceCreateOnBehalfOfRecipientMutation,
    lnNoAmountInvoiceCreateOnBehalfOfRecipient:
      LnNoAmountInvoiceCreateOnBehalfOfRecipientMutation,
  },

  authed: {
    atAccountLevel: {
      userLoginUpgrade: UserLoginUpgradeMutation,
      userEmailRegistrationInitiate: UserEmailRegistrationInitiateMutation,
      userEmailRegistrationValidate: UserEmailRegistrationValidateMutation,
      userEmailDelete: UserEmailDeleteMutation,
      userPhoneRegistrationInitiate: UserPhoneRegistrationInitiateMutation,
      userPhoneRegistrationValidate: UserPhoneRegistrationValidateMutation,
      userPhoneDelete: UserPhoneDeleteMutation,
      userTotpRegistrationInitiate: UserTotpRegistrationInitiateMutation,
      userTotpRegistrationValidate: UserTotpRegistrationValidateMutation,
      userTotpDelete: UserTotpDeleteMutation,

      userQuizQuestionUpdateCompleted: UserQuizQuestionUpdateCompletedMutation,
      quizCompleted: QuizCompletedMutation,
      deviceNotificationTokenCreate: DeviceNotificationTokenCreateMutation,

      userUpdateLanguage: UserUpdateLanguageMutation,
      userUpdateUsername: UserUpdateUsernameMutation,
      userContactUpdateAlias: UserContactUpdateAliasMutation,
      accountUpdateDefaultWalletId: AccountUpdateDefaultWalletIdMutation,
      accountUpdateDisplayCurrency: AccountUpdateDisplayCurrencyMutation,
      accountDelete: AccountDeleteMutation,
      feedbackSubmit: FeedbackSubmitMutation,

      callbackEndpointAdd: CallbackEndpointAdd,
      callbackEndpointDelete: CallbackEndpointDelete,
    },

    atWalletLevel: {
      intraLedgerPaymentSend: IntraLedgerPaymentSendMutation,
      intraLedgerUsdPaymentSend: IntraLedgerUsdPaymentSendMutation,

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

      onChainAddressCreate: OnChainAddressCreateMutation,
      onChainAddressCurrent: OnChainAddressCurrentMutation,
      onChainPaymentSend: OnChainPaymentSendMutation,
      onChainUsdPaymentSend: OnChainUsdPaymentSendMutation,
      onChainUsdPaymentSendAsBtcDenominated:
        OnChainUsdPaymentSendAsBtcDenominatedMutation,
      onChainPaymentSendAll: OnChainPaymentSendAllMutation,
    },
  },
}

export const MutationType = GT.Object({
  name: "Mutation",
  fields: {
    ...mutationFields.unauthed,
    ...mutationFields.authed.atAccountLevel,
    ...mutationFields.authed.atWalletLevel,
  },
})
