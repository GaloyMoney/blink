import UserUpdatePhoneMutation from "./root/mutation/user-update-phone"

import BusinessDeleteMapInfoMutation from "./root/mutation/delete-business-map"

import AccountUpdateLevelMutation from "./root/mutation/account-update-level"
import AccountUpdateStatusMutation from "./root/mutation/account-update-status"
import AdminPushNotificationSendMutation from "./root/mutation/admin-push-notification-send"
import BusinessUpdateMapInfoMutation from "./root/mutation/business-update-map-info"

import { GT } from "@/graphql/index"

export const mutationFields = {
  unauthed: {},
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
  fields: () => ({ ...mutationFields.authed }),
})
