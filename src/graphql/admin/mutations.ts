import { GT } from "@graphql/index"

import UserRequestAuthCodeMutation from "@graphql/root/mutation/user-request-auth-code"
import UserLoginMutation from "@graphql/root/mutation/user-login"

import AccountUpdateLevelMutation from "@graphql/admin/root/mutation/account-update-level"
import AccountUpdateStatusMutation from "@graphql/admin/root/mutation/account-update-status"
import BusinessUpdateMapInfoMutation from "@graphql/admin/root/mutation/business-update-map-info"

const MutationType = GT.Object({
  name: "Mutation",
  fields: () => ({
    userRequestAuthCode: UserRequestAuthCodeMutation,
    userLogin: UserLoginMutation,

    accountUpdateLevel: AccountUpdateLevelMutation,
    accountUpdateStatus: AccountUpdateStatusMutation,

    businessUpdateMapInfo: BusinessUpdateMapInfoMutation,
  }),
})

export default MutationType
