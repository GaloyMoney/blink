import UserUpdatePhoneMutation from "./root/mutation/user-update-phone"

import MerchantMapDeleteMutation from "./root/mutation/merchant-map-delete"
import MerchantMapValidateMutation from "./root/mutation/merchant-map-validate"

import AccountUpdateLevelMutation from "./root/mutation/account-update-level"
import AccountUpdateStatusMutation from "./root/mutation/account-update-status"
import AdminPushNotificationSendMutation from "./root/mutation/admin-push-notification-send"

import { GT } from "@/graphql/index"

export const mutationFields = {
  unauthed: {},
  authed: {
    userUpdatePhone: UserUpdatePhoneMutation,
    accountUpdateLevel: AccountUpdateLevelMutation,
    accountUpdateStatus: AccountUpdateStatusMutation,
    merchantMapValidate: MerchantMapValidateMutation,
    merchantMapDelete: MerchantMapDeleteMutation,
    adminPushNotificationSend: AdminPushNotificationSendMutation,
  },
}

export const MutationType = GT.Object<null, GraphQLAdminContext>({
  name: "Mutation",
  fields: () => ({ ...mutationFields.authed }),
})
