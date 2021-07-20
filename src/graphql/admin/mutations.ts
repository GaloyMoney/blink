import { GT } from "../index"
import { login, requestPhoneCode } from "../../text"

const MutationType = new GT.Object({
  name: "Mutation",
  fields: () => ({
    requestPhoneCode: {
      type: GT.Boolean,
      args: {
        phone: { type: GT.NonNull(GT.String) },
      },
      resolve: (_, { phone }, { logger, ip }) => {
        return requestPhoneCode({ phone, logger, ip })
      },
    },
    login: {
      type: GT.String,
      args: {
        phone: { type: GT.NonNull(GT.String) },
        code: { type: GT.NonNull(GT.String) },
      },
      resolve: (_, { phone, code }, { logger, ip }) => {
        return login({ phone, code, logger, ip })
      },
    },
  }),
})

export default MutationType
