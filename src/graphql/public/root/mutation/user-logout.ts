import { GT } from "@graphql/index"

import { logoutToken } from "@app/authentication"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import SuccessPayload from "@graphql/shared/types/payload/success-payload"

const UserLogoutMutation = GT.Field<
  null,
  GraphQLPublicContextAuth,
  {
    input: {
      authToken: AuthToken | InputValidationError
    }
  }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(SuccessPayload),
  resolve: async (_, __, { sessionId }) => {
    const logoutResp = await logoutToken(sessionId)
    if (logoutResp instanceof Error)
      return { errors: [mapAndParseErrorForGqlResponse(logoutResp)], success: false }
    return { errors: [], success: true }
  },
})

export default UserLogoutMutation
