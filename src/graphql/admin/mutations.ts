import { GT } from "@graphql/index"

import UserUpdateStatusMutation from "@graphql/root/mutation/user-update-status"
import UserUpdateLevelMutation from "@graphql/root/mutation/user-update-level"
import BusinessUpdateMapInfoMutation from "@graphql/root/mutation/business-update-map-info"

import UserRequestAuthCodeMutation from "@graphql/root/mutation/user-request-auth-code"
import UserLoginMutation from "@graphql/root/mutation/user-login"

const MutationType = new GT.Object({
  name: "Mutation",
  fields: () => ({
    userRequestAuthCode: UserRequestAuthCodeMutation,
    userLogin: UserLoginMutation,
    userUpdateStatus: UserUpdateStatusMutation,
    userUpdateLevel: UserUpdateLevelMutation,
    businessUpdateMapInfo: BusinessUpdateMapInfoMutation,
  }),
})

export default MutationType
