import { GT } from "@/graphql/index"

import { Authentication } from "@/app"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import UserEmailDeletePayload from "@/graphql/public/types/payload/user-email-delete"

const UserEmailDeleteMutation = GT.Field<null, GraphQLPublicContextAuth>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(UserEmailDeletePayload),
  resolve: async (_, args, { user }) => {
    const me = await Authentication.removeEmail({
      userId: user.id,
    })

    if (me instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(me)] }
    }

    return { errors: [], me }
  },
})

export default UserEmailDeleteMutation
