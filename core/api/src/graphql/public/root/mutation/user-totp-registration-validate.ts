import { GT } from "@/graphql/index"
import { Authentication } from "@/app"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import TotpCode from "@/graphql/public/types/scalar/totp-code"
import TotpRegistrationId from "@/graphql/public/types/scalar/totp-verify-id"
import UserTotpRegistrationValidatePayload from "@/graphql/public/types/payload/user-totp-registration-validate"

const UserTotpRegistrationValidateInput = GT.Input({
  name: "UserTotpRegistrationValidateInput",
  fields: () => ({
    totpCode: {
      type: GT.NonNull(TotpCode),
    },
    totpRegistrationId: {
      type: GT.NonNull(TotpRegistrationId),
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
    const { totpCode, totpRegistrationId } = args.input

    if (totpCode instanceof Error) {
      return { errors: [{ message: totpCode.message }] }
    }

    if (totpRegistrationId instanceof Error) {
      return { errors: [{ message: totpRegistrationId.message }] }
    }

    const me = await Authentication.validateTotpRegistration({
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
