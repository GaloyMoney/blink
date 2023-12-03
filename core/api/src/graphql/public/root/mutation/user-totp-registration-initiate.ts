import { GT } from "@/graphql/index"
import { AuthWithPhonePasswordlessService } from "@/services/kratos"
import { Authentication } from "@/app"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import UserTotpRegistrationInitiatePayload from "@/graphql/public/types/payload/user-totp-registration-initiate"
import { kratosPublic } from "@/services/kratos/private"

const UserTotpRegistrationInitiateMutation = GT.Field<null, GraphQLPublicContextAuth>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(UserTotpRegistrationInitiatePayload),
  resolve: async (_, __, { user }) => {
    const authService = AuthWithPhonePasswordlessService()
    const { phone } = user

    if (phone === undefined) {
      return { errors: [{ message: "Phone is undefined" }] }
    }

    const kratosResult = await authService.loginToken({ phone })
    if (kratosResult instanceof Error) return kratosResult
    const { authToken } = kratosResult

    const res = await Authentication.initiateTotpRegistration({
      authToken,
    })

    const res2 = await kratosPublic.toSession({ xSessionToken: authToken })
    const sessionId = res2.data.id as SessionId
    await authService.logoutToken({ sessionId })

    if (res instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(res)], success: false }
    }

    const { totpSecret, totpRegistrationId } = res

    return { errors: [], totpRegistrationId, totpSecret }
  },
})

export default UserTotpRegistrationInitiateMutation
