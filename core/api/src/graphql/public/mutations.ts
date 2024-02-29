import CallbackEndpointAdd from "./root/mutation/callback-endpoint-add"

import CallbackEndpointDelete from "./root/mutation/callback-endpoint-delete"

import AccountEnableNotificationCategoryMutation from "./root/mutation/account-enable-notification-category-for-channel"

import AccountDisableNotificationCategoryMutation from "./root/mutation/account-disable-notification-category-for-channel"

import AccountEnableNotificationChannelMutation from "./root/mutation/account-enable-notification-channel"

import AccountDisableNotificationChannelMutation from "./root/mutation/account-disable-notification-channel"

import LnAddressPaymentSendMutation from "./root/mutation/ln-address-payment-send"

import LnurlPaymentSendMutation from "./root/mutation/lnurl-payment-send"

import { GT } from "@/graphql/index"

import DeviceNotificationTokenCreateMutation from "@/graphql/public/root/mutation/device-notification-token-create"
import IntraLedgerPaymentSendMutation from "@/graphql/public/root/mutation/intraledger-payment-send"
import IntraLedgerUsdPaymentSendMutation from "@/graphql/public/root/mutation/intraledger-usd-payment-send"
import LnInvoiceCreateMutation from "@/graphql/public/root/mutation/ln-invoice-create"
import LnInvoiceCreateOnBehalfOfRecipientMutation from "@/graphql/public/root/mutation/ln-invoice-create-on-behalf-of-recipient"
import LnInvoiceFeeProbeMutation from "@/graphql/public/root/mutation/ln-invoice-fee-probe"
import LnInvoicePaymentSendMutation from "@/graphql/public/root/mutation/ln-invoice-payment-send"
import LnNoAmountInvoiceCreateMutation from "@/graphql/public/root/mutation/ln-noamount-invoice-create"
import LnNoAmountInvoiceCreateOnBehalfOfRecipientMutation from "@/graphql/public/root/mutation/ln-noamount-invoice-create-on-behalf-of-recipient"
import LnNoAmountInvoiceFeeProbeMutation from "@/graphql/public/root/mutation/ln-noamount-invoice-fee-probe"
import LnNoAmountInvoicePaymentSendMutation from "@/graphql/public/root/mutation/ln-noamount-invoice-payment-send"
import LnNoAmountUsdInvoiceFeeProbeMutation from "@/graphql/public/root/mutation/ln-noamount-usd-invoice-fee-probe"
import LnNoAmountUsdInvoicePaymentSendMutation from "@/graphql/public/root/mutation/ln-noamount-usd-invoice-payment-send"
import LnUsdInvoiceBtcDenominatedCreateOnBehalfOfRecipientMutation from "@/graphql/public/root/mutation/ln-usd-invoice-btc-denominated-create-on-behalf-of-recipient"
import LnUsdInvoiceCreateMutation from "@/graphql/public/root/mutation/ln-usd-invoice-create"
import LnUsdInvoiceCreateOnBehalfOfRecipientMutation from "@/graphql/public/root/mutation/ln-usd-invoice-create-on-behalf-of-recipient"
import LnUsdInvoiceFeeProbeMutation from "@/graphql/public/root/mutation/ln-usd-invoice-fee-probe"
import OnChainAddressCreateMutation from "@/graphql/public/root/mutation/on-chain-address-create"
import OnChainAddressCurrentMutation from "@/graphql/public/root/mutation/on-chain-address-current"
import UserLoginMutation from "@/graphql/public/root/mutation/user-login"

import AccountDeleteMutation from "@/graphql/public/root/mutation/account-delete"
import AccountUpdateDefaultWalletIdMutation from "@/graphql/public/root/mutation/account-update-default-wallet-id"
import AccountUpdateDisplayCurrencyMutation from "@/graphql/public/root/mutation/account-update-display-currency"
import FeedbackSubmitMutation from "@/graphql/public/root/mutation/feedback-submit"
import OnChainPaymentSendMutation from "@/graphql/public/root/mutation/onchain-payment-send"
import OnChainPaymentSendAllMutation from "@/graphql/public/root/mutation/onchain-payment-send-all"
import OnChainUsdPaymentSendMutation from "@/graphql/public/root/mutation/onchain-usd-payment-send"
import OnChainUsdPaymentSendAsBtcDenominatedMutation from "@/graphql/public/root/mutation/onchain-usd-payment-send-as-sats"
import UserContactUpdateAliasMutation from "@/graphql/public/root/mutation/user-contact-update-alias"
import UserEmailDeleteMutation from "@/graphql/public/root/mutation/user-email-delete"
import UserEmailRegistrationInitiateMutation from "@/graphql/public/root/mutation/user-email-registration-initiate"
import UserEmailRegistrationValidateMutation from "@/graphql/public/root/mutation/user-email-registration-validate"
import UserLoginUpgradeMutation from "@/graphql/public/root/mutation/user-login-upgrade"
import UserLogoutMutation from "@/graphql/public/root/mutation/user-logout"
import UserPhoneDeleteMutation from "@/graphql/public/root/mutation/user-phone-delete"
import UserPhoneRegistrationInitiateMutation from "@/graphql/public/root/mutation/user-phone-registration-initiate"
import UserPhoneRegistrationValidateMutation from "@/graphql/public/root/mutation/user-phone-registration-validate"
import UserTotpDeleteMutation from "@/graphql/public/root/mutation/user-totp-delete"
import UserTotpRegistrationInitiateMutation from "@/graphql/public/root/mutation/user-totp-registration-initiate"
import UserTotpRegistrationValidateMutation from "@/graphql/public/root/mutation/user-totp-registration-validate"
import UserUpdateLanguageMutation from "@/graphql/public/root/mutation/user-update-language"
import UserUpdateUsernameMutation from "@/graphql/public/root/mutation/user-update-username"
import CaptchaCreateChallengeMutation from "@/graphql/public/root/mutation/captcha-create-challenge"
import CaptchaRequestAuthCodeMutation from "@/graphql/public/root/mutation/captcha-request-auth-code"
import QuizClaimMutation from "@/graphql/public/root/mutation/quiz-claim"
import MerchantMapSuggest from "@/graphql/public/root/mutation/merchant-map-suggest"

// TODO: // const fields: { [key: string]: GraphQLFieldConfig<any, GraphQLPublicContext> }
export const mutationFields = {
  unauthed: {
    captchaCreateChallenge: CaptchaCreateChallengeMutation,
    captchaRequestAuthCode: CaptchaRequestAuthCodeMutation,
    userLogin: UserLoginMutation,

    lnInvoiceCreateOnBehalfOfRecipient: LnInvoiceCreateOnBehalfOfRecipientMutation,
    lnUsdInvoiceCreateOnBehalfOfRecipient: LnUsdInvoiceCreateOnBehalfOfRecipientMutation,
    lnUsdInvoiceBtcDenominatedCreateOnBehalfOfRecipient:
      LnUsdInvoiceBtcDenominatedCreateOnBehalfOfRecipientMutation,
    lnNoAmountInvoiceCreateOnBehalfOfRecipient:
      LnNoAmountInvoiceCreateOnBehalfOfRecipientMutation,

    merchantMapSuggest: MerchantMapSuggest,
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
      userLogout: UserLogoutMutation,

      quizClaim: QuizClaimMutation,
      deviceNotificationTokenCreate: DeviceNotificationTokenCreateMutation,

      userUpdateLanguage: UserUpdateLanguageMutation,
      userUpdateUsername: UserUpdateUsernameMutation,
      userContactUpdateAlias: UserContactUpdateAliasMutation,
      accountUpdateDefaultWalletId: AccountUpdateDefaultWalletIdMutation,
      accountUpdateDisplayCurrency: AccountUpdateDisplayCurrencyMutation,
      accountEnableNotificationCategory: AccountEnableNotificationCategoryMutation,
      accountDisableNotificationCategory: AccountDisableNotificationCategoryMutation,
      accountEnableNotificationChannel: AccountEnableNotificationChannelMutation,
      accountDisableNotificationChannel: AccountDisableNotificationChannelMutation,

      accountDelete: AccountDeleteMutation,
      feedbackSubmit: FeedbackSubmitMutation,

      callbackEndpointAdd: CallbackEndpointAdd,
      callbackEndpointDelete: CallbackEndpointDelete,
    },

    atWalletLevel: {
      send: {
        intraLedgerPaymentSend: IntraLedgerPaymentSendMutation,
        intraLedgerUsdPaymentSend: IntraLedgerUsdPaymentSendMutation,

        lnAddressPaymentSend: LnAddressPaymentSendMutation,
        lnurlPaymentSend: LnurlPaymentSendMutation,
        lnInvoiceFeeProbe: LnInvoiceFeeProbeMutation,
        lnUsdInvoiceFeeProbe: LnUsdInvoiceFeeProbeMutation,
        lnNoAmountInvoiceFeeProbe: LnNoAmountInvoiceFeeProbeMutation,
        lnNoAmountUsdInvoiceFeeProbe: LnNoAmountUsdInvoiceFeeProbeMutation,

        lnInvoicePaymentSend: LnInvoicePaymentSendMutation,
        lnNoAmountInvoicePaymentSend: LnNoAmountInvoicePaymentSendMutation,
        lnNoAmountUsdInvoicePaymentSend: LnNoAmountUsdInvoicePaymentSendMutation,

        onChainPaymentSend: OnChainPaymentSendMutation,
        onChainUsdPaymentSend: OnChainUsdPaymentSendMutation,
        onChainUsdPaymentSendAsBtcDenominated:
          OnChainUsdPaymentSendAsBtcDenominatedMutation,
        onChainPaymentSendAll: OnChainPaymentSendAllMutation,
      },
      receive: {
        lnInvoiceCreate: LnInvoiceCreateMutation,
        lnUsdInvoiceCreate: LnUsdInvoiceCreateMutation,
        lnNoAmountInvoiceCreate: LnNoAmountInvoiceCreateMutation,
        onChainAddressCreate: OnChainAddressCreateMutation,
        onChainAddressCurrent: OnChainAddressCurrentMutation,
      },
    },
  },
}

export const MutationType = GT.Object({
  name: "Mutation",
  fields: {
    ...mutationFields.unauthed,
    ...mutationFields.authed.atAccountLevel,
    ...mutationFields.authed.atWalletLevel.send,
    ...mutationFields.authed.atWalletLevel.receive,
  },
})
