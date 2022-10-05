import { GT } from "@graphql/index"

import Phone from "@graphql/types/scalar/phone"
import SuccessPayload from "@graphql/types/payload/success-payload"
import { Users } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import { getCaptcha } from "@config"

const UserRequestAuthCodeInput = GT.Input({
  name: "UserRequestAuthCodeInput",
  fields: () => ({
    phone: {
      type: GT.NonNull(Phone),
    },
  }),
})

const UserRequestAuthCodeMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(SuccessPayload),
  args: {
    input: { type: GT.NonNull(UserRequestAuthCodeInput) },
  },
  resolve: async (_, args, { logger, ip }) => {
    const isCaptchaMandatory = getCaptcha().mandatory
    if (isCaptchaMandatory) {
      return { errors: [{ message: "use captcha endpoint to request auth code" }] }
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
      return { errors: [mapAndParseErrorForGqlResponse(status)] }
    }

    return { errors: [], success: status }
  },
})

export default UserRequestAuthCodeMutation
