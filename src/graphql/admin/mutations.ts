import { GT } from "@graphql/index"

import UserRequestAuthCodeMutation from "@graphql/root/mutation/user-request-auth-code"
import UserLoginMutation from "@graphql/root/mutation/user-login"
import CaptchaRequestAuthCodeMutation from "@graphql/root/mutation/captcha-request-auth-code"
import CaptchaCreateChallengeMutation from "@graphql/root/mutation/captcha-create-challenge"

import AccountUpdateLevelMutation from "@graphql/admin/root/mutation/account-update-level"
import AccountUpdateStatusMutation from "@graphql/admin/root/mutation/account-update-status"
import BusinessUpdateMapInfoMutation from "@graphql/admin/root/mutation/business-update-map-info"
import ColdStorageRebalanceToHotWalletMutation from "@graphql/admin/root/mutation/cold-storage-rebalance-to-hot-wallet"

import UserUpdatePhoneMutation from "./root/mutation/user-update-phone"
import AccountsAddUsdWalletMutation from "./root/mutation/account-add-usd-wallet"
import BusinessDeleteMapInfoMutation from "./root/mutation/delete-business-map"

export const mutationFields = {
  unauthed: {
    userRequestAuthCode: UserRequestAuthCodeMutation,
    userLogin: UserLoginMutation,

    captchaCreateChallenge: CaptchaCreateChallengeMutation,
    captchaRequestAuthCode: CaptchaRequestAuthCodeMutation,
  },
  authed: {
    userUpdatePhone: UserUpdatePhoneMutation,
    accountUpdateLevel: AccountUpdateLevelMutation,
    accountUpdateStatus: AccountUpdateStatusMutation,
    accountsAddUsdWallet: AccountsAddUsdWalletMutation,
    businessUpdateMapInfo: BusinessUpdateMapInfoMutation,
    businessDeleteMapInfo: BusinessDeleteMapInfoMutation,
    coldStorageRebalanceToHotWallet: ColdStorageRebalanceToHotWalletMutation,
  },
}

export const MutationType = GT.Object({
  name: "Mutation",
  fields: () => ({ ...mutationFields.unauthed, ...mutationFields.authed }),
})
