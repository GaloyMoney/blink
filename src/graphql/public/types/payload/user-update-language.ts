import { GT } from "@graphql/index"

import GraphQLUser from "../object/user"
import IError from "../../../shared/types/abstract/error"

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
