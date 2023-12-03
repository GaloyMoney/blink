import { GT } from "@/graphql/index"
import { AuthWithPhonePasswordlessService } from "@/services/kratos"
import { Authentication } from "@/app"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import TotpCode from "@/graphql/public/types/scalar/totp-code"
import TotpRegistrationId from "@/graphql/public/types/scalar/totp-verify-id"
import UserTotpRegistrationValidatePayload from "@/graphql/public/types/payload/user-totp-registration-validate"
import { kratosPublic } from "@/services/kratos/private"

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
    const { phone } = user

    if (totpCode instanceof Error) {
      return { errors: [{ message: totpCode.message }] }
    }

    if (totpRegistrationId instanceof Error) {
      return { errors: [{ message: totpRegistrationId.message }] }
    }

    const authService = AuthWithPhonePasswordlessService()

    if (phone === undefined) {
      return { errors: [{ message: "Phone is undefined" }] }
    }

    const kratosResult = await authService.loginToken({ phone })
    if (kratosResult instanceof Error) return kratosResult
    const { authToken } = kratosResult

    const me = await Authentication.validateTotpRegistration({
      authToken,
      totpCode,
      totpRegistrationId,
      userId: user.id,
    })

    const res = await kratosPublic.toSession({ xSessionToken: authToken })
    const sessionId = res.data.id as SessionId
    await authService.logoutToken({ sessionId })

    if (me instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(me)], success: false }
    }

    return { errors: [], me }
  },
})

export default UserTotpRegistrationValidateMutation
