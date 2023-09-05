import { GT } from "@graphql/index"

import UserLoginMutation from "@graphql/shared/root/mutation/user-login"
import CaptchaRequestAuthCodeMutation from "@graphql/shared/root/mutation/captcha-request-auth-code"
import CaptchaCreateChallengeMutation from "@graphql/shared/root/mutation/captcha-create-challenge"

import AccountUpdateLevelMutation from "@graphql/admin/root/mutation/account-update-level"
import AccountUpdateStatusMutation from "@graphql/admin/root/mutation/account-update-status"
import BusinessUpdateMapInfoMutation from "@graphql/admin/root/mutation/business-update-map-info"

import UserUpdatePhoneMutation from "./root/mutation/user-update-phone"
import BusinessDeleteMapInfoMutation from "./root/mutation/delete-business-map"
import AdminPushNotificationSendMutation from "./root/mutation/admin-push-notification-send"

export const mutationFields = {
  unauthed: {
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
    adminPushNotificationSend: AdminPushNotificationSendMutation,
  },
}

export const MutationType = GT.Object<null, GraphQLAdminContext>({
  name: "Mutation",
  fields: () => ({ ...mutationFields.unauthed, ...mutationFields.authed }),
})
