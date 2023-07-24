import { GT } from "@graphql/index"

import AuthToken from "@graphql/types/scalar/auth-token"
import { logoutToken } from "@app/authentication"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import SuccessPayload from "@graphql/types/payload/success-payload"

const UserLogoutInput = GT.Input({
  name: "UserLogoutInput",
  fields: () => ({
    authToken: {
      type: GT.NonNull(AuthToken),
    },
  }),
})

const UserLogoutMutation = GT.Field<{
  input: {
    authToken: SessionToken | InputValidationError
  }
}>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(SuccessPayload),
  args: {
    input: { type: GT.NonNull(UserLogoutInput) },
  },
  resolve: async (_, args) => {
    const { authToken } = args.input
    if (authToken instanceof Error) return
    const logoutResp = await logoutToken(authToken)
    if (logoutResp instanceof Error)
      return { errors: [mapAndParseErrorForGqlResponse(logoutResp)], success: false }
    return { errors: [], success: true }
  },
})

export default UserLogoutMutation
