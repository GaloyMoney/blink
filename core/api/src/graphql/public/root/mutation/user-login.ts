import { GT } from "@/graphql/index"
import OneTimeAuthCode from "@/graphql/shared/types/scalar/one-time-auth-code"

import Phone from "@/graphql/shared/types/scalar/phone"
import AuthTokenPayload from "@/graphql/shared/types/payload/auth-token"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import { Authentication } from "@/app"
import ReferralCode from "@/graphql/shared/types/scalar/referral-code"

const UserLoginInput = GT.Input({
  name: "UserLoginInput",
  fields: () => ({
    phone: {
      type: GT.NonNull(Phone),
    },
    code: {
      type: GT.NonNull(OneTimeAuthCode),
    },
    referralCode: {
      type: ReferralCode,
    },
  }),
})

const UserLoginMutation = GT.Field<
  null,
  GraphQLPublicContext,
  {
    input: {
      phone: PhoneNumber | InputValidationError
      code: PhoneCode | InputValidationError
      referralCode?: ReferralCode | InputValidationError
    }
  }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(AuthTokenPayload),
  args: {
    input: { type: GT.NonNull(UserLoginInput) },
  },
  resolve: async (_, args, { ip }) => {
    const { phone, code, referralCode } = args.input

    if (phone instanceof Error) {
      return { errors: [{ message: phone.message }] }
    }

    if (code instanceof Error) {
      return { errors: [{ message: code.message }] }
    }

    if (referralCode instanceof Error) {
      return { errors: [{ message: referralCode.message }] }
    }

    if (ip === undefined) {
      return { errors: [{ message: "ip is undefined" }] }
    }

    const res = await Authentication.loginWithPhoneToken({
      phone,
      code,
      ip,
      referralCode,
    })

    if (res instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(res)] }
    }

    const { authToken, totpRequired } = res

    return { errors: [], authToken, totpRequired }
  },
})

export default UserLoginMutation
