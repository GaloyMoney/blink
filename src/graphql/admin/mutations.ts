import { GT } from "@graphql/index"

import UserRequestAuthCodeMutation from "@graphql/shared/root/mutation/user-request-auth-code"
import UserLoginMutation from "@graphql/shared/root/mutation/user-login"
import CaptchaRequestAuthCodeMutation from "@graphql/shared/root/mutation/captcha-request-auth-code"
import CaptchaCreateChallengeMutation from "@graphql/shared/root/mutation/captcha-create-challenge"

import AccountUpdateLevelMutation from "@graphql/admin/root/mutation/account-update-level"
import AccountUpdateStatusMutation from "@graphql/admin/root/mutation/account-update-status"
import BusinessUpdateMapInfoMutation from "@graphql/admin/root/mutation/business-update-map-info"

import UserUpdatePhoneMutation from "./root/mutation/user-update-phone"
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
    businessUpdateMapInfo: BusinessUpdateMapInfoMutation,
    businessDeleteMapInfo: BusinessDeleteMapInfoMutation,
  },
}

export const MutationType = GT.Object({
  name: "Mutation",
  fields: () => ({ ...mutationFields.unauthed, ...mutationFields.authed }),
})
