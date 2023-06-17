import { GT } from "@graphql/index"

import { Auth } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import Phone from "@graphql/types/scalar/phone"

import OneTimeAuthCode from "@graphql/types/scalar/one-time-auth-code"
import UserPhoneVerifyPayload from "@graphql/types/payload/user-phone-verify"

const UserPhoneVerifyInput = GT.Input({
  name: "UserPhoneVerifyInput",
  fields: () => ({
    phone: { type: GT.NonNull(Phone) },
    code: { type: GT.NonNull(OneTimeAuthCode) },
  }),
})

const UserPhoneVerifyMutation = GT.Field<
  {
    input: {
      phone: PhoneNumber | InputValidationError
      code: PhoneCode | InputValidationError
    }
  },
  null,
  GraphQLContextAuth
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(UserPhoneVerifyPayload),
  args: {
    input: { type: GT.NonNull(UserPhoneVerifyInput) },
  },
  resolve: async (_, args, { ip, user }) => {
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

    const me = await Auth.verifyPhone({
      userId: user.id,
      phone,
      code,
      ip,
    })

    if (me instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(me)] }
    }

    return { errors: [], me }
  },
})

export default UserPhoneVerifyMutation
