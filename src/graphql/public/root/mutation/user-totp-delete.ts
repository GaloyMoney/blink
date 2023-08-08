import { GT } from "@graphql/index"

import { Auth } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import UserTotpDeletePayload from "@graphql/public/types/payload/user-totp-delete"
import AuthToken from "@graphql/shared/types/scalar/auth-token"

const UserTotpDeleteInput = GT.Input({
  name: "UserTotpDeleteInput",
  fields: () => ({
    authToken: {
      type: GT.NonNull(AuthToken),
    },
  }),
})

const UserTotpDeleteMutation = GT.Field<
  {
    input: {
      authToken: AuthToken | InputValidationError
    }
  },
  null,
  GraphQLContextAuth
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(UserTotpDeletePayload),
  args: {
    input: { type: GT.NonNull(UserTotpDeleteInput) },
  },
  resolve: async (_, args, { user }) => {
    const { authToken } = args.input

    if (authToken instanceof Error) {
      return { errors: [{ message: authToken.message }] }
    }

    const me = await Auth.removeTotp({
      authToken,
      userId: user.id,
    })

    if (me instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(me)] }
    }

    return { errors: [], me }
  },
})

export default UserTotpDeleteMutation
