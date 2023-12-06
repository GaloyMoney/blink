import { GT } from "@/graphql/index"

import { Authentication } from "@/app"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import UserTotpDeletePayload from "@/graphql/public/types/payload/user-totp-delete"

const UserTotpDeleteMutation = GT.Field<null, GraphQLPublicContextAuth>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(UserTotpDeletePayload),
  resolve: async (_, __, { user }) => {
    const me = await Authentication.removeTotp({
      userId: user.id,
    })

    if (me instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(me)] }
    }

    return { errors: [], me }
  },
})

export default UserTotpDeleteMutation
