import { requestPhoneCode } from "@core/text"
import { GT } from "@graphql/index"

import Phone from "@graphql/types/scalar/phone"
import SuccessPayload from "@graphql/types/payload/success-payload"

const UserRequestAuthCodeInput = new GT.Input({
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

    // TODO: Make this through a new app use-case
    const status = await requestPhoneCode({ phone, logger, ip })

    if (!status) {
      return { errors: [{ message: "Could not complete the operation successfully" }] }
    }

    return { errors: [], success: status }
  },
})

export default UserRequestAuthCodeMutation
