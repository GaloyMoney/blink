import { GT } from "@graphql/index"
import OneTimeAuthCode from "@graphql/types/scalar/one-time-auth-code"

import Phone from "@graphql/types/scalar/phone"
import AuthTokenPayload from "@graphql/types/payload/auth-token"
import { Auth } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"

const UserLoginInput = GT.Input({
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

const UserLoginMutation = GT.Field<{
  input: {
    phone: PhoneNumber | InputValidationError
    code: PhoneCode | InputValidationError
  }
}>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(AuthTokenPayload),
  args: {
    input: { type: GT.NonNull(UserLoginInput) },
  },
  resolve: async (_, args, { ip }) => {
    const { phone, code } = args.input

    if (phone instanceof Error) {
      return { errors: [{ message: phone.message }] }
    }

    if (code instanceof Error) {
      return { errors: [{ message: code.message }] }
    }

    if (ip === undefined) {
      return { errors: [{ message: "ip is undefined" }] }
    }

    const res = await Auth.loginWithPhoneToken({
      phone,
      code,
      ip,
    })

    if (res instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(res)] }
    }

    const { authToken, totpRequired } = res

    return { errors: [], authToken, totpRequired }
  },
})

export default UserLoginMutation
