import { GT } from "@/graphql/index"
import { Authentication } from "@/app"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import TotpCode from "@/graphql/public/types/scalar/totp-code"
import TotpRegistrationId from "@/graphql/public/types/scalar/totp-verify-id"
import UserTotpRegistrationValidatePayload from "@/graphql/public/types/payload/user-totp-registration-validate"
import AuthToken from "@/graphql/shared/types/scalar/auth-token"

const UserTotpRegistrationValidateInput = GT.Input({
  name: "UserTotpRegistrationValidateInput",
  fields: () => ({
    totpCode: {
      type: GT.NonNull(TotpCode),
    },
    totpRegistrationId: {
      type: GT.NonNull(TotpRegistrationId),
    },
    authToken: {
      type: AuthToken,
    },
  }),
})

const UserTotpRegistrationValidateMutation = GT.Field<
  null,
  GraphQLPublicContextAuth,
  {
    input: {
      totpCode: TotpCode | InputValidationError
      totpRegistrationId: TotpRegistrationId | InputValidationError
      authToken: AuthToken | null
    }
  }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(UserTotpRegistrationValidatePayload),
  args: {
    input: { type: GT.NonNull(UserTotpRegistrationValidateInput) },
  },
  resolve: async (_, args, { user }) => {
    const { totpCode, totpRegistrationId, authToken } = args.input

    if (totpCode instanceof Error) {
      return { errors: [{ message: totpCode.message }] }
    }

    if (totpRegistrationId instanceof Error) {
      return { errors: [{ message: totpRegistrationId.message }] }
    }

    const me = await Authentication.validateTotpRegistration({
      authToken,
      totpCode,
      totpRegistrationId,
      userId: user.id,
    })

    if (me instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(me)], success: false }
    }

    return { errors: [], me }
  },
})

export default UserTotpRegistrationValidateMutation
