import { GT } from "@graphql/index"

import { Auth } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import UserPhoneDeletePayload from "@graphql/public/types/payload/user-phone-delete"

const UserPhoneDeleteMutation = GT.Field<null, null, GraphQLContextAuth>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(UserPhoneDeletePayload),
  resolve: async (_, args, { user }) => {
    const me = await Auth.removePhoneFromIdentity({
      userId: user.id,
    })

    if (me instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(me)] }
    }

    return { errors: [], me }
  },
})

export default UserPhoneDeleteMutation
