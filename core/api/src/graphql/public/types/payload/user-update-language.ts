import GraphQLUser from "../object/user"

import IError from "@/graphql/shared/types/abstract/error"
import { GT } from "@/graphql/index"

const UserUpdateLanguagePayload = GT.Object({
  name: "UserUpdateLanguagePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    // FIXME: should be me {} instead of user {}
    user: {
      type: GraphQLUser,
    },
  }),
})

export default UserUpdateLanguagePayload
