import { GT } from "@graphql/index"

import UserUpdateStatusMutation from "@graphql/root/mutation/user-update-status"
import UserUpdateLevelMutation from "@graphql/root/mutation/user-update-level"
import BusinessUpdateMapInfoMutation from "@graphql/root/mutation/business-update-map-info"

import { login, requestPhoneCode } from "@core/text"

const MutationType = new GT.Object({
  name: "Mutation",
  fields: () => ({
    // TODO: Move to root
    requestPhoneCode: {
      type: GT.Boolean,
      args: {
        phone: { type: GT.NonNull(GT.String) },
      },
      resolve: async (_, { phone }, { logger, ip }) => {
        return requestPhoneCode({ phone, logger, ip })
      },
    },
    // TODO: Move to root
    login: {
      type: GT.String,
      args: {
        phone: { type: GT.NonNull(GT.String) },
        code: { type: GT.NonNull(GT.String) },
      },
      resolve: async (_, { phone, code }, { logger, ip }) => {
        const token = await login({ phone, code, logger, ip })
        return token?.toString()
      },
    },
    userUpdateStatus: UserUpdateStatusMutation,
    userUpdateLevel: UserUpdateLevelMutation,
    businessUpdateMapInfo: BusinessUpdateMapInfoMutation,
  }),
})

export default MutationType
