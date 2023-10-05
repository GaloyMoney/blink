import { GT } from "@/graphql/index"

import { logoutToken } from "@/app/authentication"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import SuccessPayload from "@/graphql/shared/types/payload/success-payload"

const UserLogoutInput = GT.Input({
  name: "UserLogoutInput",
  fields: () => ({
    deviceToken: { type: GT.NonNull(GT.String) },
  }),
})

const UserLogoutMutation = GT.Field<
  null,
  GraphQLPublicContextAuth,
  {
    input: {
      deviceToken: DeviceToken | undefined
    }
  }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(SuccessPayload),
  args: {
    input: { type: UserLogoutInput },
  },
  resolve: async (_, args, { sessionId, user }) => {
    const deviceToken = args?.input?.deviceToken

    const logoutResp = await logoutToken({ sessionId, deviceToken, userId: user.id })
    if (logoutResp instanceof Error)
      return { errors: [mapAndParseErrorForGqlResponse(logoutResp)], success: false }
    return { errors: [], success: true }
  },
})

export default UserLogoutMutation
