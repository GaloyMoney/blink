import { login } from "@core/text"
import { GT } from "@graphql/index"
import OneTimeAuthCode from "../scalar/one-time-auth-code"

import Phone from "../scalar/phone"
import AuthTokenPayload from "./payload/auth-token"

const UserLoginInput = new GT.Input({
  name: "UserLoginInput",
  fields: () => ({
    phone: {
      type: GT.NonNull(Phone),
    },
    code: {
      type: GT.NonNull(OneTimeAuthCode),
    },
  }),
})

const UserLoginMutation = {
  type: GT.NonNull(AuthTokenPayload),
  args: {
    input: { type: GT.NonNull(UserLoginInput) },
  },
  resolve: async (_, args, { user, logger, ip }) => {
    if (user) {
      return { errors: [{ message: "Invalid request" }] } // TODO: confirm
    }

    const { phone, code } = args.input

    if (phone instanceof Error) {
      return { errors: [{ message: phone.message }] }
    }

    if (code instanceof Error) {
      return { errors: [{ message: code.message }] }
    }

    // TODO: Make this through a new app use-case
    const authToken = await login({ phone, code, logger, ip })

    if (!authToken) {
      return { errors: [{ message: "Invalid request" }] }
    }

    return { errors: [], authToken }
  },
}

export default UserLoginMutation
