import { GT } from "@graphql/index"

import { Auth } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import UserEmailDeletePayload from "@graphql/types/payload/user-email-delete"

const UserEmailDeleteMutation = GT.Field<null, null, GraphQLContextAuth>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(UserEmailDeletePayload),
  resolve: async (_, args, { user }) => {
    const me = await Auth.removeEmail({
      userId: user.id,
    })

    if (me instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(me)] }
    }

    return { errors: [], me }
  },
})

export default UserEmailDeleteMutation
