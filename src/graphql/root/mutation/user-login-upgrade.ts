import { GT } from "@graphql/index"
import OneTimeAuthCode from "@graphql/types/scalar/one-time-auth-code"

import Phone from "@graphql/types/scalar/phone"
import AuthTokenPayload from "@graphql/types/payload/auth-token"
import { Auth } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"

const UserLoginUpgradeInput = GT.Input({
  name: "UserLoginUpgradeInput",
  fields: () => ({
    phone: {
      type: GT.NonNull(Phone),
    },
    code: {
      type: GT.NonNull(OneTimeAuthCode),
    },
  }),
})

const UserLoginUpgradeMutation = GT.Field<
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
  type: GT.NonNull(AuthTokenPayload),
  args: {
    input: { type: GT.NonNull(UserLoginUpgradeInput) },
  },
  resolve: async (_, args, { ip, domainAccount }) => {
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

    const authToken = await Auth.loginUpgradeWithPhone({
      phone,
      code,
      ip,
      account: domainAccount,
    })

    if (authToken instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(authToken)] }
    }

    return { errors: [], authToken }
  },
})

export default UserLoginUpgradeMutation
