import { GT } from "@graphql/index"
import OneTimeAuthCode from "@graphql/types/scalar/one-time-auth-code"

import Phone from "@graphql/types/scalar/phone"
import AuthTokenPayload from "@graphql/types/payload/auth-token"
import { Auth } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import AuthToken from "@graphql/types/scalar/auth-token"

const UserLoginUpgradeInput = GT.Input({
  name: "UserLoginUpgradeInput",
  fields: () => ({
    phone: {
      type: GT.NonNull(Phone),
    },
    code: {
      type: GT.NonNull(OneTimeAuthCode),
    },
    authToken: {
      type: GT.NonNull(AuthToken),
    },
  }),
})

const UserLoginUpgradeMutation = GT.Field<
  {
    input: {
      phone: PhoneNumber | InputValidationError
      code: PhoneCode | InputValidationError
      authToken: SessionToken | InputValidationError
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
    const { phone, code, authToken: orgAuthToken } = args.input

    if (phone instanceof Error) {
      return { errors: [{ message: phone.message }] }
    }

    if (code instanceof Error) {
      return { errors: [{ message: code.message }] }
    }

    if (orgAuthToken instanceof Error) {
      return { errors: [{ message: orgAuthToken.message }] }
    }

    if (ip === undefined) {
      return { errors: [{ message: "ip is undefined" }] }
    }

    const authToken = await Auth.loginUpgradeWithPhoneV2({
      phone,
      code,
      ip,
      account: domainAccount,
      authToken: orgAuthToken,
    })

    if (authToken instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(authToken)] }
    }

    return { errors: [], authToken }
  },
})

export default UserLoginUpgradeMutation
