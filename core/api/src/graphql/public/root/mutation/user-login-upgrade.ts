import { Authentication } from "@/app"

import { ErrorLevel } from "@/domain/shared"
import { recordExceptionInCurrentSpan } from "@/services/tracing"
import { baseLogger } from "@/services/logger"

import { GT } from "@/graphql/index"
import OneTimeAuthCode from "@/graphql/shared/types/scalar/one-time-auth-code"
import Phone from "@/graphql/shared/types/scalar/phone"
import UpgradePayload from "@/graphql/public/types/payload/upgrade-payload"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import { IpMissingInContextError } from "@/graphql/error"

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
  null,
  GraphQLPublicContextAuth,
  {
    input: {
      phone: PhoneNumber | InputValidationError
      code: PhoneCode | InputValidationError
    }
  }
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
      return { errors: [{ message: phone.message }], success: false }
    }

    if (code instanceof Error) {
      return { errors: [{ message: code.message }], success: false }
    }

    if (ip === undefined) {
      const error = new IpMissingInContextError({ logger: baseLogger })
      recordExceptionInCurrentSpan({
        error,
        level: ErrorLevel.Critical,
      })
      return {
        errors: [error],
        success: false,
      }
    }

    const res = await Authentication.loginDeviceUpgradeWithPhone({
      phone,
      code,
      ip,
      account: domainAccount,
    })

    if (res instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(res)], success: false }
    }

    return { errors: [], success: res.success, authToken: res.authToken }
  },
})

export default UserLoginUpgradeMutation
