import { GT } from "@graphql/index"

import UserRequestAuthCodeMutation from "@graphql/root/mutation/user-request-auth-code"
import UserLoginMutation from "@graphql/root/mutation/user-login"

import UserUpdateLevelMutation from "@graphql/admin/root/mutation/user-update-level"
import UserUpdateStatusMutation from "@graphql/admin/root/mutation/user-update-status"
import BusinessUpdateMapInfoMutation from "@graphql/admin/root/mutation/business-update-map-info"

const MutationType = new GT.Object({
  name: "Mutation",
  fields: () => ({
    userRequestAuthCode: UserRequestAuthCodeMutation,
    userLogin: UserLoginMutation,

    userUpdateLevel: UserUpdateLevelMutation,
    userUpdateStatus: UserUpdateStatusMutation,

    businessUpdateMapInfo: BusinessUpdateMapInfoMutation,
  }),
})

export default MutationType
