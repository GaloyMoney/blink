import { GT } from "@graphql/index"
import OneTimeAuthCode from "@graphql/types/scalar/one-time-auth-code"

import Phone from "@graphql/types/scalar/phone"
import { Auth } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import UpgradePayload from "@graphql/types/payload/upgrade-payload"

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
  type: GT.NonNull(UpgradePayload),
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

    const res = await Auth.loginDeviceUpgradeWithPhone({
      phone,
      code,
      ip,
      account: domainAccount,
    })

    if (res instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(res)], success: false }
    }

    return { errors: [], success: res.success, authToken: res.sessionToken }
  },
})

export default UserLoginUpgradeMutation
