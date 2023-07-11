import { GT } from "@graphql/index"

import { Auth } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import Phone from "@graphql/types/scalar/phone"

import OneTimeAuthCode from "@graphql/types/scalar/one-time-auth-code"
import UserPhoneRegistrationValidatePayload from "@graphql/types/payload/user-phone-registration-validate"

const UserPhoneRegistrationValidateInput = GT.Input({
  name: "UserPhoneRegistrationValidateInput",
  fields: () => ({
    phone: { type: GT.NonNull(Phone) },
    code: { type: GT.NonNull(OneTimeAuthCode) },
  }),
})

const UserPhoneRegistrationValidateMutation = GT.Field<
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
  type: GT.NonNull(UserPhoneRegistrationValidatePayload),
  args: {
    input: { type: GT.NonNull(UserPhoneRegistrationValidateInput) },
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

export default UserPhoneRegistrationValidateMutation
