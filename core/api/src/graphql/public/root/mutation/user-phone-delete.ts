import { GT } from "@/graphql/index"

import { Authentication } from "@/app"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import UserPhoneDeletePayload from "@/graphql/public/types/payload/user-phone-delete"

const UserPhoneDeleteMutation = GT.Field<null, GraphQLPublicContextAuth>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(UserPhoneDeletePayload),
  resolve: async (_, args, { user }) => {
    const me = await Authentication.removePhoneFromIdentity({
      userId: user.id,
    })

    if (me instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(me)] }
    }

    return { errors: [], me }
  },
})

export default UserPhoneDeleteMutation
