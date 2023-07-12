import { GT } from "@graphql/index"

import AuthToken from "@graphql/types/scalar/auth-token"
import AuthTokenPayload from "@graphql/types/payload/auth-token"
import { logoutToken } from "@app/authentication"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"

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
  type: GT.NonNull(AuthTokenPayload),
  args: {
    input: { type: GT.NonNull(UserLogoutInput) },
  },
  resolve: async (_, args) => {
    const { authToken } = args.input
    if (authToken instanceof Error) return
    const logoutResp = await logoutToken(authToken)
    if (logoutResp instanceof Error)
      return { errors: [mapAndParseErrorForGqlResponse(logoutResp)] }
    return { errors: [] }
  },
})

export default UserLogoutMutation
