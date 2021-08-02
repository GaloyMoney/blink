import { GT } from "../index"
import { login, requestPhoneCode } from "@core/text"

import UserUpdateStatusMutation from "../types/mutations/user-update-status"
import UserUpdateLevelMutation from "../types/mutations/user-update-level"
import MerchantUpdateMapInfoMutation from "../types/mutations/merchant-update-map-info"

const MutationType = new GT.Object({
  name: "Mutation",
  fields: () => ({
    requestPhoneCode: {
      type: GT.Boolean,
      args: {
        phone: { type: GT.NonNull(GT.String) },
      },
      resolve: async (_, { phone }, { logger, ip }) => {
        return await requestPhoneCode({ phone, logger, ip })
      },
    },
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
    merchantUpdateMapInfo: MerchantUpdateMapInfoMutation,
  }),
})

export default MutationType
