import { GT } from "@/graphql/index"
import { Authentication } from "@/app"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import UserTotpRegistrationInitiatePayload from "@/graphql/public/types/payload/user-totp-registration-initiate"

const UserTotpRegistrationInitiateMutation = GT.Field<null, GraphQLPublicContextAuth>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(UserTotpRegistrationInitiatePayload),
  resolve: async (_, __, { user }) => {
    const res = await Authentication.initiateTotpRegistration({
      userId: user.id,
    })

    if (res instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(res)], success: false }
    }

    const { totpSecret, totpRegistrationId } = res

    return { errors: [], totpRegistrationId, totpSecret }
  },
})

export default UserTotpRegistrationInitiateMutation
