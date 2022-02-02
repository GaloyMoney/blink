import { GT } from "@graphql/index"

import Phone from "@graphql/types/scalar/phone"
import SuccessPayload from "@graphql/types/payload/success-payload"
import { Users } from "@app"
import { mapError } from "@graphql/error-map"

const UserRequestAuthCodeInput = GT.Input({
  name: "UserRequestAuthCodeInput",
  fields: () => ({
    phone: {
      type: GT.NonNull(Phone),
    },
  }),
})

const UserRequestAuthCodeMutation = GT.Field({
  type: GT.NonNull(SuccessPayload),
  args: {
    input: { type: GT.NonNull(UserRequestAuthCodeInput) },
  },
  resolve: async (_, args, { user, logger, ip }) => {
    if (user) {
      return { errors: [{ message: "Invalid request" }] } // TODO: confirm
    }

    const { phone } = args.input

    if (phone instanceof Error) {
      return { errors: [{ message: phone.message }] }
    }

    if (ip === undefined) {
      return { errors: [{ message: "ip is undefined" }] }
    }

    const status = await Users.requestPhoneCode({ phone, logger, ip })

    if (status instanceof Error) {
      return { errors: [mapError(status)] }
    }

    return { errors: [], success: status }
  },
})

export default UserRequestAuthCodeMutation
